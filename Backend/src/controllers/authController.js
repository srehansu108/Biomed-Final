// controllers/authController.js - COMPLETE VOLUNTEER REGISTRATION (FIXED)
const Volunteer = require('../models/User');
const Fingerprint = require('../models/Fingerprint');
const Session = require('../models/Session');
const JWTService = require('../services/jwtService');
const EncryptionService = require('../services/encryptionService');
const BiometricService = require('../services/biometricService');
const AuditService = require('../services/auditService');
const { sendSuccess, sendError } = require('../utils/response');
const { FINGER_TYPES } = require('../config/biometric');
const { deleteProfileImage } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

class AuthController {
  /**
   * REGISTER VOLUNTEER - Complete registration with all fields
   */
  async registerVolunteer(req, res) {
    console.log('\n🔵 ===== VOLUNTEER REGISTRATION STARTED =====');
    
    try {
      const {
        firstName, middleName, lastName,
        dateOfBirth, gender, maritalStatus,
        stateOfOrigin, localGovernment, city, residentialAddress,
        phone, alternatePhone,
        emergencyContactName, emergencyContactPhone,
        languages, languageNotes,
        dietaryHabit,
        idProofType,
        education, occupation, remarks,
        fingerprints,
        profileImage // base64 string (optional)
      } = req.body;

      // ============================================
      // ✅ CORRECT FILE ACCESS FROM MIXED UPLOAD
      // ============================================
      const profilePhotoFile = req.files?.profilePhoto?.[0] || null;
      const documentFiles = req.files?.documents || [];

      console.log('📝 Received volunteer data:', {
        firstName,
        lastName,
        phone,
        fingerprintsCount: fingerprints ? Object.keys(fingerprints).length : 0,
        hasProfilePhoto: !!profilePhotoFile,
        documentCount: documentFiles.length
      });

      console.log('📁 Files received:');
      console.log(`  📸 Profile photo: ${profilePhotoFile ? profilePhotoFile.originalname : 'None'}`);
      console.log(`  📄 Documents: ${documentFiles.length} file(s)`);
      if (documentFiles.length > 0) {
        documentFiles.forEach((file, i) => {
          console.log(`    ${i + 1}. ${file.originalname} (${file.size} bytes)`);
        });
      }

      // ============================================
      // 1. VALIDATE REQUIRED FIELDS
      // ============================================
      const requiredFields = [
        'firstName', 'lastName', 'dateOfBirth', 'gender', 'maritalStatus',
        'stateOfOrigin', 'localGovernment', 'city', 'residentialAddress',
        'phone', 'emergencyContactName', 'emergencyContactPhone',
        'dietaryHabit', 'education', 'occupation'
      ];

      const missingFields = requiredFields.filter(field => !req.body[field]);
      if (missingFields.length > 0) {
        return sendError(res, 400, `Missing required fields: ${missingFields.join(', ')}`);
      }

      // ============================================
      // 2. VALIDATE FINGERPRINTS
      // ============================================
      if (!fingerprints || Object.keys(fingerprints).length === 0) {
        return sendError(res, 400, 'At least one fingerprint is required');
      }

      // ============================================
      // 3. CHECK IF VOLUNTEER EXISTS
      // ============================================
      const sanitizedPhone = phone.replace(/\D/g, '');
      const existingVolunteer = await Volunteer.findOne({ 
        $or: [
          { phone: sanitizedPhone },
          { volunteerId: req.body.volunteerId }
        ]
      });

      if (existingVolunteer) {
        return sendError(res, 409, 'Volunteer already registered with this phone number');
      }

      // ============================================
      // 4. PARSE LANGUAGES - FIXED
      // ============================================
      let parsedLanguages = {
        english: { read: false, write: false, speak: false, understand: false },
        yoruba: { read: false, write: false, speak: false, understand: false },
        igbo: { read: false, write: false, speak: false, understand: false },
        hausa: { read: false, write: false, speak: false, understand: false },
        other: { name: '', read: false, write: false, speak: false, understand: false }
      };

      if (languages) {
        try {
          parsedLanguages = typeof languages === 'string' 
            ? JSON.parse(languages) 
            : languages;
        } catch (e) {
          console.warn('Failed to parse languages, using default');
        }
      }

      // ============================================
      // 5. PARSE ID PROOF TYPES
      // ============================================
      let parsedIdProofType = [];
      if (idProofType) {
        try {
          parsedIdProofType = typeof idProofType === 'string'
            ? JSON.parse(idProofType)
            : idProofType;
        } catch (e) {
          parsedIdProofType = [idProofType];
        }
      }

      // ============================================
      // 6. PARSE EDUCATION - FIXED (handle array from frontend)
      // ============================================
      let parsedEducation = [];
      if (education) {
        try {
          parsedEducation = typeof education === 'string'
            ? JSON.parse(education)
            : education;
        } catch (e) {
          parsedEducation = [education];
        }
      }

      // ============================================
      // 7. CREATE VOLUNTEER
      // ============================================
      const volunteer = new Volunteer({
        firstName: firstName.trim(),
        middleName: middleName?.trim() || '',
        lastName: lastName.trim(),
        dateOfBirth: new Date(dateOfBirth),
        gender,
        maritalStatus,
        stateOfOrigin: stateOfOrigin.trim(),
        localGovernment: localGovernment.trim(),
        city: city.trim(),
        residentialAddress: residentialAddress.trim(),
        phone: sanitizedPhone,
        alternatePhone: alternatePhone?.replace(/\D/g, '') || '',
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.replace(/\D/g, ''),
        languages: parsedLanguages,
        languageNotes: languageNotes || '',
        dietaryHabit,
        idProofType: parsedIdProofType,
        education: parsedEducation,
        occupation: occupation.trim(),
        remarks: remarks || '',
        status: 'active',
        isVerified: true,
        role: 'volunteer'
      });

      // ============================================
      // 8. HANDLE PROFILE PHOTO - FIXED
      // ============================================
      if (profilePhotoFile) {
        volunteer.profileImage = profilePhotoFile.path;
        console.log('📸 Profile photo saved:', profilePhotoFile.path);
      } else if (profileImage && typeof profileImage === 'string' && profileImage.startsWith('data:image')) {
        try {
          const base64Data = profileImage.replace(/^data:image\/\w+;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const filename = `profile-${uniqueSuffix}.jpg`;
          const filepath = path.join('uploads/profiles', filename);
          
          if (!fs.existsSync('uploads/profiles')) {
            fs.mkdirSync('uploads/profiles', { recursive: true });
          }
          
          fs.writeFileSync(filepath, imageBuffer);
          volunteer.profileImage = filepath;
          console.log('📸 Base64 profile photo saved:', filepath);
        } catch (error) {
          console.error('Failed to save base64 image:', error);
        }
      }

      // ============================================
      // 9. HANDLE MULTIPLE DOCUMENTS - FIXED
      // ============================================
      if (documentFiles && documentFiles.length > 0) {
        const documentPaths = documentFiles.map(file => file.path);
        volunteer.documents = documentPaths;
        console.log(`📄 ${documentPaths.length} documents saved`);
        documentPaths.forEach((path, i) => {
          console.log(`  ${i + 1}. ${path}`);
        });
      }

      // ============================================
      // 10. SAVE VOLUNTEER
      // ============================================
      await volunteer.save();
      console.log('✅ Volunteer created with ID:', volunteer._id);
      console.log('📋 Volunteer ID:', volunteer.volunteerId);
      console.log('🔤 Initials:', volunteer.initials);

      // ============================================
      // 11. SAVE FINGERPRINTS
      // ============================================
      console.log('🔐 Saving fingerprints...');
      const savedFingerprints = [];
      
      for (const [fingerType, fingerData] of Object.entries(fingerprints)) {
        if (!Object.values(FINGER_TYPES).includes(fingerType)) {
          await Volunteer.findByIdAndDelete(volunteer._id);
          return sendError(res, 400, `Invalid finger type: ${fingerType}`);
        }

        if (!fingerData || !fingerData.data || typeof fingerData.data !== 'string') {
          await Volunteer.findByIdAndDelete(volunteer._id);
          return sendError(res, 400, `Invalid ${fingerType} template data`);
        }

        let templateData = fingerData.data;
        try {
          const decompressed = Buffer.from(templateData, 'base64').toString();
          templateData = decompressed;
        } catch (e) {}

        const encrypted = EncryptionService.encrypt(templateData, volunteer._id.toString());
        const qualityScore = fingerData.quality || 70;

        const fingerprint = new Fingerprint({
          userId: volunteer._id,
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
        console.log(`  ✅ ${fingerType} saved`);
      }

      // ============================================
      // 12. LOG AUDIT
      // ============================================
      await AuditService.log({
        userId: volunteer._id,
        action: 'register_volunteer',
        status: 'success',
        req,
        details: { 
          firstName, 
          lastName,
          phone: sanitizedPhone,
          volunteerId: volunteer.volunteerId,
          fingerprints: Object.keys(fingerprints).length,
          documents: documentFiles.length
        }
      });

      // ============================================
      // 13. GENERATE TOKENS
      // ============================================
      const tokens = JWTService.generateTokenPair(volunteer);

      const session = new Session({
        userId: volunteer._id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        deviceInfo: {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip || req.connection.remoteAddress
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      await session.save();

      console.log('✅ ===== VOLUNTEER REGISTRATION COMPLETED =====\n');
      
      sendSuccess(res, 201, 'Volunteer registered successfully', {
        user: volunteer.sanitize(),
        fingerprints: savedFingerprints.map(f => f.sanitize()),
        tokens,
        session: session.sanitize()
      });

    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('❌ Stack trace:', error.stack);
      
      // ✅ Cleanup uploaded files if error occurs
      if (req.files) {
        if (req.files.profilePhoto) {
          req.files.profilePhoto.forEach(file => deleteProfileImage(file.path));
        }
        if (req.files.documents) {
          req.files.documents.forEach(file => deleteProfileImage(file.path));
        }
      }
      
      sendError(res, 500, error.message || 'Registration failed');
    }
  }

  /**
   * REGISTER - Original registration (kept for backward compatibility)
   */
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

      if (!fullName) return sendError(res, 400, 'Full name is required');
      if (!email) return sendError(res, 400, 'Email is required');
      if (!phone) return sendError(res, 400, 'Phone is required');
      
      if (!fingerprints || Object.keys(fingerprints).length === 0) {
        return sendError(res, 400, 'At least one fingerprint is required');
      }

      const sanitizedEmail = email.toLowerCase().trim();
      const sanitizedPhone = phone.replace(/\D/g, '');

      const existingUser = await Volunteer.findOne({
        $or: [
          { email: sanitizedEmail },
          { phone: sanitizedPhone }
        ]
      });

      if (existingUser) {
        return sendError(res, 409, 'User already exists with this email or phone');
      }

      const user = new Volunteer({
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

      console.log('🔐 Saving fingerprints...');
      const savedFingerprints = [];
      
      for (const [fingerType, fingerData] of Object.entries(fingerprints)) {
        console.log(`  📌 Processing ${fingerType}...`);
        
        if (!Object.values(FINGER_TYPES).includes(fingerType)) {
          await Volunteer.findByIdAndDelete(user._id);
          return sendError(res, 400, `Invalid finger type: ${fingerType}`);
        }

        if (!fingerData || !fingerData.data || typeof fingerData.data !== 'string') {
          await Volunteer.findByIdAndDelete(user._id);
          return sendError(res, 400, `Invalid ${fingerType} template data`);
        }

        let templateData = fingerData.data;
        try {
          const decompressed = Buffer.from(templateData, 'base64').toString();
          templateData = decompressed;
        } catch (e) {}

        const encrypted = EncryptionService.encrypt(templateData, user._id.toString());
        const qualityScore = fingerData.quality || 70;

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
        console.log(`  ✅ ${fingerType} saved`);
      }

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

      const tokens = JWTService.generateTokenPair(user);

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

  /**
   * LOGIN - Fingerprint authentication
   */
  async login(req, res) {
    console.log('\n🔵 ===== LOGIN STARTED =====');
    
    try {
      const { email, fingerprintData } = req.body;

      if (!email || !fingerprintData) {
        return sendError(res, 400, 'Email and fingerprint data required');
      }

      const sanitizedEmail = email.toLowerCase().trim();
      console.log('🔍 Looking for user:', sanitizedEmail);

      const user = await Volunteer.findOne({ email: sanitizedEmail });
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

      if (user.isLocked) {
        return sendError(res, 423, 'Account locked. Please try again after 30 minutes.');
      }

      if (user.status === 'suspended') {
        return sendError(res, 403, 'Account suspended');
      }

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

      const tokens = JWTService.generateTokenPair(user);

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

  /**
   * LOGOUT - Invalidate session
   */
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
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

  /**
   * REFRESH TOKEN - Rotate tokens
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return sendError(res, 400, 'Refresh token required');
      }

      const session = await Session.findOne({ 
        refreshToken, 
        isActive: true 
      });

      if (!session) {
        return sendError(res, 401, 'Invalid or expired refresh token');
      }

      const decoded = JWTService.verifyRefreshToken(refreshToken);
      const user = await Volunteer.findById(decoded.userId);
      
      if (!user) {
        return sendError(res, 401, 'User not found');
      }

      if (user.status === 'suspended') {
        return sendError(res, 403, 'Account suspended');
      }

      const newTokens = JWTService.refreshTokens(refreshToken);

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

  /**
   * VERIFY FINGERPRINT - Verify a single fingerprint
   */
  async verifyFingerprint(req, res) {
    try {
      const { userId, fingerprintData, fingerType } = req.body;

      if (!userId || !fingerprintData) {
        return sendError(res, 400, 'User ID and fingerprint data required');
      }

      const user = await Volunteer.findById(userId);
      if (!user) {
        return sendError(res, 404, 'User not found');
      }

      const query = { userId: user._id, isActive: true };
      if (fingerType) {
        query.fingerType = fingerType;
      }

      const fingerprint = await Fingerprint.findOne(query);
      if (!fingerprint) {
        return sendError(res, 404, 'Fingerprint not found');
      }

      const verification = await BiometricService.verifyFingerprint(
        fingerprintData,
        fingerprint,
        user._id.toString()
      );

      if (!verification.success) {
        return sendError(res, 400, verification.error || 'Verification failed');
      }

      await fingerprint.incrementVerification(
        verification.isMatch ? 'success' : 'failure',
        verification.matchScore
      );

      sendSuccess(res, 200, 'Fingerprint verified', {
        isMatch: verification.isMatch,
        matchScore: verification.matchScore,
        fingerType: fingerprint.fingerType
      });
    } catch (error) {
      console.error('Verify fingerprint error:', error);
      sendError(res, 500, error.message);
    }
  }

  /**
   * GET VOLUNTEER BY ID - Get volunteer details
   */
  async getVolunteer(req, res) {
    try {
      const { id } = req.params;

      const volunteer = await Volunteer.findById(id)
        .select('-loginAttempts -lockUntil -__v');

      if (!volunteer) {
        return sendError(res, 404, 'Volunteer not found');
      }

      if (req.user.role !== 'admin' && req.user._id.toString() !== volunteer._id.toString()) {
        return sendError(res, 403, 'Unauthorized to view this profile');
      }

      sendSuccess(res, 200, 'Volunteer retrieved', volunteer.sanitize());
    } catch (error) {
      console.error('Get volunteer error:', error);
      sendError(res, 500, error.message);
    }
  }

  /**
   * UPDATE VOLUNTEER - Update volunteer details
   */
  async updateVolunteer(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const volunteer = await Volunteer.findById(id);
      if (!volunteer) {
        return sendError(res, 404, 'Volunteer not found');
      }

      if (req.user.role !== 'admin' && req.user._id.toString() !== volunteer._id.toString()) {
        return sendError(res, 403, 'Unauthorized to update this profile');
      }

      const allowedFields = [
        'firstName', 'middleName', 'lastName', 'gender', 'maritalStatus',
        'stateOfOrigin', 'localGovernment', 'city', 'residentialAddress',
        'phone', 'alternatePhone', 'emergencyContactName', 'emergencyContactPhone',
        'languages', 'languageNotes', 'dietaryHabit', 'education', 'occupation', 'remarks'
      ];

      const filteredUpdates = {};
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      }

      if (filteredUpdates.phone) {
        const sanitizedPhone = filteredUpdates.phone.replace(/\D/g, '');
        const existing = await Volunteer.findOne({
          phone: sanitizedPhone,
          _id: { $ne: volunteer._id }
        });
        if (existing) {
          return sendError(res, 409, 'Phone number already in use');
        }
        filteredUpdates.phone = sanitizedPhone;
      }

      // Handle profile image update from files
      const profilePhotoFile = req.files?.profilePhoto?.[0] || null;
      if (profilePhotoFile) {
        if (volunteer.profileImage) {
          deleteProfileImage(volunteer.profileImage);
        }
        filteredUpdates.profileImage = profilePhotoFile.path;
      }

      // Handle documents update
      const documentFiles = req.files?.documents || [];
      if (documentFiles.length > 0) {
        // Delete old documents
        if (volunteer.documents && volunteer.documents.length > 0) {
          volunteer.documents.forEach(doc => deleteProfileImage(doc));
        }
        filteredUpdates.documents = documentFiles.map(file => file.path);
      }

      Object.assign(volunteer, filteredUpdates);
      await volunteer.save();

      await AuditService.log({
        userId: req.userId,
        action: 'update_volunteer',
        status: 'success',
        req,
        details: { volunteerId: volunteer._id, updatedFields: Object.keys(filteredUpdates) }
      });

      sendSuccess(res, 200, 'Volunteer updated successfully', volunteer.sanitize());
    } catch (error) {
      console.error('Update volunteer error:', error);
      sendError(res, 500, error.message);
    }
  }

  /**
   * DELETE VOLUNTEER - Delete volunteer and all associated data
   */
  async deleteVolunteer(req, res) {
    try {
      const { id } = req.params;

      const volunteer = await Volunteer.findById(id);
      if (!volunteer) {
        return sendError(res, 404, 'Volunteer not found');
      }

      if (req.user.role !== 'admin') {
        return sendError(res, 403, 'Only admins can delete volunteers');
      }

      if (volunteer.profileImage) {
        deleteProfileImage(volunteer.profileImage);
      }

      if (volunteer.documents && volunteer.documents.length > 0) {
        volunteer.documents.forEach(doc => deleteProfileImage(doc));
      }

      await Fingerprint.deleteMany({ userId: volunteer._id });
      await Session.deleteMany({ userId: volunteer._id });
      await volunteer.deleteOne();

      await AuditService.log({
        userId: req.userId,
        action: 'delete_volunteer',
        status: 'success',
        req,
        details: { deletedVolunteerId: volunteer._id, volunteerId: volunteer.volunteerId }
      });

      sendSuccess(res, 200, 'Volunteer deleted successfully');
    } catch (error) {
      console.error('Delete volunteer error:', error);
      sendError(res, 500, error.message);
    }
  }

  /**
   * GET ALL VOLUNTEERS - Admin only
   */
  async getAllVolunteers(req, res) {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      
      const query = {};
      if (status) query.status = status;
      
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { volunteerId: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [volunteers, total] = await Promise.all([
        Volunteer.find(query)
          .select('-loginAttempts -lockUntil -__v')
          .skip(skip)
          .limit(parseInt(limit))
          .sort({ createdAt: -1 }),
        Volunteer.countDocuments(query)
      ]);

      sendSuccess(res, 200, 'Volunteers retrieved', {
        volunteers: volunteers.map(v => v.sanitize()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get volunteers error:', error);
      sendError(res, 500, error.message);
    }
  }
}

module.exports = new AuthController();