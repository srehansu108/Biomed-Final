// validators/authValidator.js - VOLUNTEER REGISTRATION VALIDATION
const { body, check } = require('express-validator');

const calculateAge = (birthDate) => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const authValidator = {
  registerVolunteer: [
    // === PERSONAL INFORMATION ===
    body('firstName')
      .trim()
      .notEmpty().withMessage('First name is required')
      .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),

    body('middleName')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Middle name too long'),

    body('lastName')
      .trim()
      .notEmpty().withMessage('Last name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),

    body('dateOfBirth')
      .notEmpty().withMessage('Date of birth is required')
      .isISO8601().withMessage('Invalid date format')
      .custom((value) => {
        const age = calculateAge(new Date(value));
        if (age < 18) {
          throw new Error('Volunteer must be at least 18 years old');
        }
        return true;
      }),

    body('gender')
      .notEmpty().withMessage('Gender is required')
      .isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),

    body('maritalStatus')
      .notEmpty().withMessage('Marital status is required')
      .isIn(['Unmarried', 'Married']).withMessage('Invalid marital status'),

    // === LOCATION ===
    body('stateOfOrigin')
      .trim()
      .notEmpty().withMessage('State of origin is required'),

    body('localGovernment')
      .trim()
      .notEmpty().withMessage('Local government is required'),

    body('city')
      .trim()
      .notEmpty().withMessage('City is required'),

    body('residentialAddress')
      .trim()
      .notEmpty().withMessage('Residential address is required')
      .isLength({ max: 500 }).withMessage('Address too long'),

    // === CONTACT ===
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required')
      .matches(/^0[0-9]{10}$/).withMessage('Phone must start with 0 and be 11 digits'),

    body('alternatePhone')
      .optional()
      .trim()
      .matches(/^0[0-9]{10}$/).withMessage('Alternate phone must start with 0 and be 11 digits'),

    // === EMERGENCY CONTACT ===
    body('emergencyContactName')
      .trim()
      .notEmpty().withMessage('Emergency contact name is required'),

    body('emergencyContactPhone')
      .trim()
      .notEmpty().withMessage('Emergency contact phone is required')
      .matches(/^0[0-9]{10}$/).withMessage('Emergency phone must start with 0 and be 11 digits'),

    // === LANGUAGES ===
    body('languages')
      .isObject().withMessage('Languages must be an object'),

    body('languages.english')
      .optional()
      .isObject().withMessage('Invalid English language format'),

    body('languages.english.read')
      .optional()
      .isBoolean().withMessage('Invalid value'),

    // Similar validation for other languages...

    // === DIETARY ===
    body('dietaryHabit')
      .notEmpty().withMessage('Dietary habit is required')
      .isIn(['Vegetarian', 'Non-Vegetarian', 'Both']).withMessage('Invalid dietary habit'),

    // === DOCUMENTS ===
    body('idProofType')
      .isArray({ min: 1 }).withMessage('At least one ID proof is required')
      .custom((value) => {
        const validTypes = [
          'Driving License', 'Voters ID Card', 'NIN', 'Organization ID-Card',
          'School Leaving Certificate', 'Passport', 'Election Card', 'Others'
        ];
        return value.every(v => validTypes.includes(v));
      }).withMessage('Invalid ID proof type'),

    // === EDUCATION ===
    body('education')
      .notEmpty().withMessage('Education is required')
      .isIn(['Primary', 'JSS', 'SSS', 'Graduation', 'Illiterate', 'University', 'PG', 'Other'])
      .withMessage('Invalid education level'),

    // === OCCUPATION ===
    body('occupation')
      .trim()
      .notEmpty().withMessage('Occupation is required')
      .isLength({ max: 200 }).withMessage('Occupation too long'),

    body('remarks')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Remarks too long'),
  ]
};

module.exports = { authValidator };