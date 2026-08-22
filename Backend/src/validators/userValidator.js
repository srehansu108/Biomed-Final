const { body, param } = require('express-validator');

const userValidator = {
  updateProfile: [
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),

    body('phone')
      .optional()
      .trim()
      .matches(/^[0-9]{10}$/).withMessage('Phone number must be 10 digits'),

    body('gender')
      .optional()
      .isIn(['Male', 'Female', 'Other', 'Prefer not to say']).withMessage('Invalid gender'),

    body('address')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters')
  ],

  updateStatus: [
    param('id')
      .isMongoId().withMessage('Invalid user ID'),

    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
  ],

  getById: [
    param('id')
      .isMongoId().withMessage('Invalid user ID')
  ]
};

module.exports = { userValidator };