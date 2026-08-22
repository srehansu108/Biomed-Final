const express = require('express');
const router = express.Router();
const FingerprintController = require('../controllers/fingerprintController');
const { auth, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { fingerprintValidator } = require('../validators/fingerprintValidator');
const { biometricLimiter } = require('../middleware/rateLimiter');

router.post(
  '/capture',
  auth,
  biometricLimiter,
  validate(fingerprintValidator.capture),
  FingerprintController.capture
);

router.post(
  '/enroll',
  auth,
  biometricLimiter,
  validate(fingerprintValidator.enroll),
  FingerprintController.enroll
);

router.get(
  '/my-fingerprints',
  auth,
  FingerprintController.getFingerprints
);

router.delete(
  '/:id',
  auth,
  validate(fingerprintValidator.delete),
  FingerprintController.deleteFingerprint
);

router.post(
  '/verify',
  auth,
  biometricLimiter,
  validate(fingerprintValidator.verify),
  FingerprintController.verify
);

router.post(
  '/verify-multiple',
  auth,
  biometricLimiter,
  validate(fingerprintValidator.verifyMultiple),
  FingerprintController.verifyMultiple
);

module.exports = router;