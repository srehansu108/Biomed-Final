const Fingerprint = require('../models/Fingerprint');
const User = require('../models/User');
const BiometricService = require('../services/biometricService');
const EncryptionService = require('../services/encryptionService');
const AuditService = require('../services/auditService');
const { sendSuccess, sendError } = require('../utils/response');
const { FINGER_TYPES } = require('../config/biometric');

class FingerprintController {
  // Capture fingerprint
  async capture(req, res) {
    try {
      const { fingerType = 'right_thumb' } = req.body;

      if (!Object.values(FINGER_TYPES).includes(fingerType)) {
        return sendError(res, 400, 'Invalid finger type');
      }

      const result = await BiometricService.captureFingerprint(fingerType);

      if (!result.success) {
        return sendError(res, 400, result.error);
      }

      await AuditService.log({
        userId: req.userId,
        action: 'fingerprint_capture',
        status: 'success',
        req,
        details: { fingerType, quality: result.quality }
      });

      sendSuccess(res, 200, 'Fingerprint captured successfully', {
        fingerType,
        quality: result.quality,
        metrics: result.metrics,
        data: result.template
      });
    } catch (error) {
      console.error('Capture error:', error);
      sendError(res, 500, error.message);
    }
  }

  // Enroll fingerprint
  async enroll(req, res) {
    try {
      const { fingerType, fingerprintData, quality, metrics } = req.body;

      if (!Object.values(FINGER_TYPES).includes(fingerType)) {
        return sendError(res, 400, 'Invalid finger type');
      }

      if (!fingerprintData) {
        return sendError(res, 400, 'Fingerprint data required');
      }

      // Check existing fingerprint
      const existingFingerprint = await Fingerprint.findOne({
        userId: req.userId,
        fingerType,
        isActive: true
      });

      if (existingFingerprint) {
        existingFingerprint.isActive = false;
        await existingFingerprint.save();
      }

      // Encrypt fingerprint
      const encrypted = EncryptionService.encrypt(
        fingerprintData,
        req.userId.toString()
      );

      const qualityScore = quality || await BiometricService.calculateQualityMetrics({
        template: fingerprintData
      }).overallQuality || 80;

      // Create fingerprint record
      const fingerprint = new Fingerprint({
        userId: req.userId,
        fingerType,
        templateHash: encrypted.hash,
        templateEncrypted: encrypted.encrypted,
        templateIv: encrypted.iv,
        templateAuthTag: encrypted.authTag,
        qualityScore,
        qualityMetrics: metrics || {},
        isActive: true,
        isPrimary: fingerType === 'right_thumb',
        deviceInfo: {
          manufacturer: req.headers['x-device-manufacturer'] || 'Unknown',
          model: req.headers['x-device-model'] || 'Unknown'
        }
      });

      await fingerprint.save();

      // Update user verification status
      await User.findByIdAndUpdate(req.userId, { isVerified: true });

      await AuditService.log({
        userId: req.userId,
        action: 'fingerprint_capture',
        status: 'success',
        req,
        details: { fingerType, quality: qualityScore }
      });

      sendSuccess(res, 201, 'Fingerprint enrolled successfully', fingerprint.sanitize());
    } catch (error) {
      console.error('Enroll error:', error);
      sendError(res, 500, error.message);
    }
  }

  // Get user's fingerprints
  async getFingerprints(req, res) {
    try {
      const fingerprints = await Fingerprint.find({
        userId: req.userId,
        isActive: true
      });

      sendSuccess(res, 200, 'Fingerprints retrieved', fingerprints.map(f => f.sanitize()));
    } catch (error) {
      console.error('Get fingerprints error:', error);
      sendError(res, 500, error.message);
    }
  }

  // Delete fingerprint
  async deleteFingerprint(req, res) {
    try {
      const fingerprint = await Fingerprint.findOne({
        _id: req.params.id,
        userId: req.userId
      });

      if (!fingerprint) {
        return sendError(res, 404, 'Fingerprint not found');
      }

      fingerprint.isActive = false;
      await fingerprint.save();

      await AuditService.log({
        userId: req.userId,
        action: 'fingerprint_delete',
        status: 'success',
        req,
        details: { fingerType: fingerprint.fingerType }
      });

      sendSuccess(res, 200, 'Fingerprint deleted successfully');
    } catch (error) {
      console.error('Delete fingerprint error:', error);
      sendError(res, 500, error.message);
    }
  }

  // Verify fingerprint
  async verify(req, res) {
    try {
      const { userId, fingerprintData } = req.body;

      if (!userId || !fingerprintData) {
        return sendError(res, 400, 'User ID and fingerprint data required');
      }

      const user = await User.findById(userId);
      if (!user) {
        return sendError(res, 404, 'User not found');
      }

      const fingerprint = await Fingerprint.findOne({
        userId: user._id,
        isPrimary: true,
        isActive: true
      });

      if (!fingerprint) {
        return sendError(res, 400, 'No registered fingerprint found');
      }

      const verification = await BiometricService.verifyFingerprint(
        fingerprintData,
        fingerprint,
        user._id.toString()
      );

      if (!verification.success) {
        return sendError(res, 400, verification.error);
      }

      // Update verification count
      await fingerprint.incrementVerification(
        verification.isMatch ? 'success' : 'failure',
        verification.matchScore
      );

      await AuditService.log({
        userId: user._id,
        action: 'fingerprint_verify',
        status: verification.isMatch ? 'success' : 'failure',
        req,
        details: { matchScore: verification.matchScore }
      });

      sendSuccess(res, 200, 'Verification completed', {
        verified: verification.isMatch,
        matchScore: verification.matchScore,
        confidence: verification.confidence
      });
    } catch (error) {
      console.error('Verify error:', error);
      sendError(res, 500, error.message);
    }
  }

  // Verify multiple fingerprints
  async verifyMultiple(req, res) {
    try {
      const { userId, fingerprints } = req.body;

      if (!Array.isArray(fingerprints) || fingerprints.length < 2) {
        return sendError(res, 400, 'At least 2 fingerprints required');
      }

      const user = await User.findById(userId);
      if (!user) {
        return sendError(res, 404, 'User not found');
      }

      const userFingerprints = await Fingerprint.find({
        userId: user._id,
        isActive: true
      });

      if (userFingerprints.length < 2) {
        return sendError(res, 400, 'User needs at least 2 registered fingerprints');
      }

      const results = [];
      let verifiedCount = 0;

      for (const fp of fingerprints) {
        const verification = await BiometricService.verifyFingerprint(
          fp,
          userFingerprints[0],
          user._id.toString()
        );

        if (verification.isMatch) verifiedCount++;
        
        results.push({
          verified: verification.isMatch,
          matchScore: verification.matchScore
        });
      }

      const threshold = 0.7;
      const isVerified = verifiedCount / fingerprints.length >= threshold;

      sendSuccess(res, 200, 'Verification completed', {
        verified: isVerified,
        verifiedCount,
        totalCount: fingerprints.length,
        threshold,
        results
      });
    } catch (error) {
      console.error('Verify multiple error:', error);
      sendError(res, 500, error.message);
    }
  }
}

module.exports = new FingerprintController();