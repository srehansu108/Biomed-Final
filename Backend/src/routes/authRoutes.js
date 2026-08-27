// routes/authRoutes.js - UPDATED WITH VOLUNTEER ROUTES (FIXED)
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { validate } = require('../middleware/validation');
const { authValidator } = require('../validators/authValidator');
const { authLimiter } = require('../middleware/rateLimiter');
const { handleMixedUpload } = require('../middleware/upload'); // ✅ IMPORT THIS

// ============================================
// VOLUNTEER REGISTRATION (with file uploads)
// ============================================
router.post(
  '/register/volunteer',
  authLimiter,
  handleMixedUpload, // ✅ Handles both profilePhoto AND documents
  validate(authValidator.registerVolunteer),
  AuthController.registerVolunteer.bind(AuthController)
);

// ============================================
// REGULAR REGISTRATION (backward compatibility)
// ============================================
router.post(
  '/register',
  authLimiter,
  validate(authValidator.register),
  AuthController.register.bind(AuthController)
);

// ============================================
// AUTHENTICATION
// ============================================
router.post(
  '/login',
  authLimiter,
  validate(authValidator.login),
  AuthController.login.bind(AuthController)
);

router.post(
  '/logout',
  AuthController.logout.bind(AuthController)
);

router.post(
  '/refresh-token',
  authLimiter,
  validate(authValidator.refreshToken),
  AuthController.refreshToken.bind(AuthController)
);

// ============================================
// VOLUNTEER MANAGEMENT
// ============================================
router.get(
  '/volunteers',
  AuthController.getAllVolunteers.bind(AuthController)
);

router.get(
  '/volunteers/:id',
  AuthController.getVolunteer.bind(AuthController)
);

router.put(
  '/volunteers/:id',
  handleMixedUpload, // ✅ Handles both profilePhoto AND documents for update
  AuthController.updateVolunteer.bind(AuthController)
);

router.delete(
  '/volunteers/:id',
  AuthController.deleteVolunteer.bind(AuthController)
);

// ============================================
// FINGERPRINT VERIFICATION
// ============================================
router.post(
  '/verify-fingerprint',
  AuthController.verifyFingerprint.bind(AuthController)
);

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working!' });
});

module.exports = router;