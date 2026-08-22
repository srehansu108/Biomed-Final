const { body } = require('express-validator');
const { FINGER_TYPES } = require('../config/biometric');

const authValidator = {
  register: [
    body('fullName')
      .trim()
      .notEmpty().withMessage('Full name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),

    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),

    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required')
      .matches(/^[0-9]{10}$/).withMessage('Phone number must be 10 digits'),

    body('gender')
      .optional()
      .isIn(['Male', 'Female', 'Other', 'Prefer not to say']).withMessage('Invalid gender'),

    body('address')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters'),

    body('fingerprints')
      .isObject().withMessage('Fingerprints must be an object'),

    body('fingerprints.*.data')
      .notEmpty().withMessage('Fingerprint data is required')
      .isString().withMessage('Fingerprint data must be a string'),

    body('fingerprints.*.quality')
      .optional()
      .isInt({ min: 0, max: 100 }).withMessage('Quality must be 0-100'),

    body('profileImage')
      .optional()
      .isString().withMessage('Profile image must be a string')
  ],

  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),

    body('fingerprintData')
      .notEmpty().withMessage('Fingerprint data is required')
      .isString().withMessage('Invalid fingerprint data')
  ],

  refreshToken: [
    body('refreshToken')
      .notEmpty().withMessage('Refresh token is required')
      .isString().withMessage('Invalid refresh token')
  ]
};

module.exports = { authValidator };