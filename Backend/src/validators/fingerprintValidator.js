const { body, param } = require('express-validator');
const { FINGER_TYPES } = require('../config/biometric');

const fingerprintValidator = {
  capture: [
    body('fingerType')
      .optional()
      .isIn(Object.values(FINGER_TYPES)).withMessage('Invalid finger type')
  ],

  enroll: [
    body('fingerType')
      .notEmpty().withMessage('Finger type is required')
      .isIn(Object.values(FINGER_TYPES)).withMessage('Invalid finger type'),

    body('fingerprintData')
      .notEmpty().withMessage('Fingerprint data is required')
      .isString().withMessage('Invalid fingerprint data')
  ],

  verify: [
    body('userId')
      .notEmpty().withMessage('User ID is required')
      .isMongoId().withMessage('Invalid user ID'),

    body('fingerprintData')
      .notEmpty().withMessage('Fingerprint data is required')
      .isString().withMessage('Invalid fingerprint data')
  ],

  verifyMultiple: [
    body('userId')
      .notEmpty().withMessage('User ID is required')
      .isMongoId().withMessage('Invalid user ID'),

    body('fingerprints')
      .isArray({ min: 2 }).withMessage('At least 2 fingerprints required')
      .custom((value) => {
        return value.every(fp => typeof fp === 'string' && fp.length > 0);
      }).withMessage('Each fingerprint must be a non-empty string')
  ],

  delete: [
    param('id')
      .isMongoId().withMessage('Invalid fingerprint ID')
  ]
};

module.exports = { fingerprintValidator };