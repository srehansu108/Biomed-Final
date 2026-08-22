const User = require('../models/User');
const Fingerprint = require('../models/Fingerprint');
const Session = require('../models/Session');
const JWTService = require('../services/jwtService');
const EncryptionService = require('../services/encryptionService');
const BiometricService = require('../services/biometricService');
const AuditService = require('../services/auditService');
const { sendSuccess, sendError } = require('../utils/response');
const { FINGER_TYPES } = require('../config/biometric');

class AuthController {
  async register(req, res) {
    console.log('\n🔵 ===== REGISTRATION STARTED =====');
    
    try {
      const { 
        fullName, email, phone, gender, address, 
        fingerprints, profileImage 
      } = req.body;

      console.log('📝 Received data:', { 
        fullName, 
        email, 
        phone, 
        fingerprintsCount: fingerprints ? Object.keys(fingerprints).length : 0,
        hasFingerprints: !!fingerprints 
      });

      // ✅ Validate required fields
      if (!fullName) return sendError(res, 400, 'Full name is required');
      if (!email) return sendError(res, 400, 'Email is required');
      if (!phone) return sendError(res, 400, 'Phone is required');
      
      if (!fingerprints || Object.keys(fingerprints).length === 0) {
        return sendError(res, 400, 'At least one fingerprint is required');
      }

      // Sanitize input
      const sanitizedEmail = email.toLowerCase().trim();
      const sanitizedPhone = phone.replace(/\D/g, '');

      // ✅ Check if user exists
      const existingUser = await User.findOne({
        $or: [
          { email: sanitizedEmail },
          { phone: sanitizedPhone }
        ]
      });

      if (existingUser) {
        return sendError(res, 409, 'User already exists with this email or phone');
      }

      // ✅ Create user
      const user = new User({
        fullName: fullName.trim(),
        email: sanitizedEmail,
        phone: sanitizedPhone,
        gender: gender || 'Prefer not to say',
        address: address?.trim() || '',
        profileImage: profileImage || null,
        status: 'active',
        isVerified: true,
        role: 'user'
      });

      await user.save();
      console.log('✅ User created with ID:', user._id);

      // ✅ Save fingerprints
      console.log('🔐 Saving fingerprints...');
      const savedFingerprints = [];
      
      for (const [fingerType, fingerData] of Object.entries(fingerprints)) {
        console.log(`  📌 Processing ${fingerType}...`);
        
        // Validate finger type
        if (!Object.values(FINGER_TYPES).includes(fingerType)) {
          await User.findByIdAndDelete(user._id);
          return sendError(res, 400, `Invalid finger type: ${fingerType}`);
        }

        // Validate fingerprint data
        if (!fingerData || !fingerData.data || typeof fingerData.data !== 'string') {
          await User.findByIdAndDelete(user._id);
          return sendError(res, 400, `Invalid ${fingerType} template data`);
        }

        // Decompress if needed
        let templateData = fingerData.data;
        try {
          const decompressed = Buffer.from(templateData, 'base64').toString();
          templateData = decompressed;
        } catch (e) {
          // Not compressed, use as is
        }

        // Encrypt fingerprint
        const encrypted = EncryptionService.encrypt(
          templateData,
          user._id.toString()
        );

        // Quality score
        const qualityScore = fingerData.quality || 
          BiometricService.calculateQualityMetrics({ template: templateData }).overallQuality;

        // Create fingerprint record
        const fingerprint = new Fingerprint({
          userId: user._id,
          fingerType: fingerType,
          templateHash: encrypted.hash,
          templateEncrypted: encrypted.encrypted,
          templateIv: encrypted.iv,
          templateAuthTag: encrypted.authTag,
          templateFormat: fingerData.format || 'ISO_19794_2',
          qualityScore: qualityScore,
          qualityMetrics: fingerData.metrics || {},
          isActive: true,
          isPrimary: fingerType === 'right_thumb',
          deviceInfo: {
            manufacturer: req.headers['x-device-manufacturer'] || 'Unknown',
            model: req.headers['x-device-model'] || 'Unknown',
            serialNumber: req.headers['x-device-serial'] || 'Unknown'
          }
        });

        await fingerprint.save();
        savedFingerprints.push(fingerprint);
        console.log(`  ✅ ${fingerType} saved with ID: ${fingerprint._id}`);
      }

      // ✅ Log audit
      await AuditService.log({
        userId: user._id,
        action: 'register',
        status: 'success',
        req,
        details: { 
          fullName, 
          email: sanitizedEmail,
          fingerprints: Object.keys(fingerprints).length 
        }
      });

      // ✅ Generate tokens
      const tokens = JWTService.generateTokenPair(user);

      // Create session
      const session = new Session({
        userId: user._id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        deviceInfo: {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      await session.save();

      console.log('✅ ===== REGISTRATION COMPLETED =====\n');
      
      sendSuccess(res, 201, 'User registered successfully', {
        user: user.sanitize(),
        fingerprints: savedFingerprints.map(f => f.sanitize()),
        tokens,
        session: session.sanitize()
      });

    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('❌ Stack trace:', error.stack);
      sendError(res, 500, error.message || 'Registration failed');
    }
  }

  async login(req, res) {
    console.log('\n🔵 ===== LOGIN STARTED =====');
    
    try {
      const { email, fingerprintData } = req.body;

      if (!email || !fingerprintData) {
        return sendError(res, 400, 'Email and fingerprint data required');
      }

      const sanitizedEmail = email.toLowerCase().trim();
      console.log('🔍 Looking for user:', sanitizedEmail);

      const user = await User.findOne({ email: sanitizedEmail });
      if (!user) {
        await AuditService.logSecurityAlert({
          userId: null,
          action: 'login',
          details: { email: sanitizedEmail, reason: 'User not found' },
          severity: 'warning'
        });
        return sendError(res, 401, 'Invalid credentials');
      }
      console.log('✅ User found:', user._id);

      // Check if account is locked
      if (user.isLocked) {
        return sendError(res, 423, 'Account locked. Please try again after 30 minutes.');
      }

      if (user.status === 'suspended') {
        return sendError(res, 403, 'Account suspended');
      }

      // Find primary fingerprint
      const fingerprint = await Fingerprint.findOne({
        userId: user._id,
        isPrimary: true,
        isActive: true
      });

      if (!fingerprint) {
        await AuditService.logSecurityAlert({
          userId: user._id,
          action: 'login',
          details: { reason: 'No primary fingerprint found' },
          severity: 'warning'
        });
        return sendError(res, 400, 'No registered fingerprint found');
      }

      // Verify fingerprint
      const verification = await BiometricService.verifyFingerprint(
        fingerprintData,
        fingerprint,
        user._id.toString()
      );

      if (!verification.success) {
        await user.incrementLoginAttempts();
        await AuditService.log({
          userId: user._id,
          action: 'login',
          status: 'failure',
          req,
          details: { error: verification.error }
        });
        return sendError(res, 401, 'Fingerprint verification failed');
      }

      if (!verification.isMatch) {
        await user.incrementLoginAttempts();
        await AuditService.log({
          userId: user._id,
          action: 'login',
          status: 'failure',
          req,
          details: { matchScore: verification.matchScore }
        });
        return sendError(res, 401, 'Fingerprint does not match');
      }

      // Successful login
      await user.resetLoginAttempts();
      await user.updateLastLogin();
      await fingerprint.incrementVerification('success', verification.matchScore);

      await AuditService.log({
        userId: user._id,
        action: 'login',
        status: 'success',
        req,
        details: { matchScore: verification.matchScore }
      });

      // Generate tokens
      const tokens = JWTService.generateTokenPair(user);

      // Create session
      const session = new Session({
        userId: user._id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        deviceInfo: {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      await session.save();

      console.log('✅ ===== LOGIN COMPLETED =====\n');

      sendSuccess(res, 200, 'Login successful', {
        user: user.sanitize(),
        tokens,
        matchScore: verification.matchScore,
        session: session.sanitize()
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      sendError(res, 500, error.message);
    }
  }

  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        // Invalidate session
        await Session.findOneAndUpdate(
          { refreshToken },
          { 
            isActive: false, 
            terminatedAt: new Date(),
            terminationReason: 'logout'
          }
        );
      }

      await AuditService.log({
        userId: req.userId,
        action: 'logout',
        status: 'success',
        req
      });

      sendSuccess(res, 200, 'Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      sendError(res, 500, error.message);
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return sendError(res, 400, 'Refresh token required');
      }

      // Check if session exists
      const session = await Session.findOne({ 
        refreshToken, 
        isActive: true 
      });

      if (!session) {
        return sendError(res, 401, 'Invalid or expired refresh token');
      }

      // Verify token
      const decoded = JWTService.verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return sendError(res, 401, 'User not found');
      }

      // Rotate tokens
      const newTokens = JWTService.refreshTokens(refreshToken);

      // Update session
      session.accessToken = newTokens.accessToken;
      session.refreshToken = newTokens.refreshToken;
      session.lastActivity = new Date();
      await session.save();

      await AuditService.log({
        userId: user._id,
        action: 'refresh_token',
        status: 'success',
        req
      });

      sendSuccess(res, 200, 'Token refreshed successfully', {
        tokens: newTokens,
        session: session.sanitize()
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      sendError(res, 401, error.message || 'Invalid refresh token');
    }
  }
}

module.exports = new AuthController();