// validators/authValidator.js - COMPLETE FIX

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
      .custom((value) => {
        // ✅ Accept multiple date formats
        let date;
        if (typeof value === 'string') {
          // Try ISO format (YYYY-MM-DD)
          date = new Date(value);
          if (isNaN(date)) {
            // Try DD/MM/YYYY format
            const parts = value.split('/');
            if (parts.length === 3) {
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1;
              const year = parseInt(parts[2]);
              date = new Date(year, month, day);
            }
          }
        } else if (value instanceof Date) {
          date = value;
        }
        
        if (!date || isNaN(date)) {
          throw new Error('Invalid date format');
        }
        
        const age = calculateAge(date);
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

    // === LANGUAGES - FIXED ===
    body('languages')
      .notEmpty().withMessage('Languages are required')
      .custom((value) => {
        // ✅ Accept both object and JSON string
        let langData = value;
        if (typeof value === 'string') {
          try {
            langData = JSON.parse(value);
          } catch (e) {
            throw new Error('Invalid languages format');
          }
        }
        
        // ✅ Check for required language fields (matches MongoDB model)
        const requiredLangs = ['english', 'yoruba', 'igbo', 'hausa', 'other'];
        const missing = requiredLangs.filter(lang => !langData[lang]);
        
        if (missing.length > 0) {
          throw new Error(`Missing language fields: ${missing.join(', ')}`);
        }
        
        // ✅ Each language must have the required skills
        const skills = ['read', 'write', 'speak', 'understand'];
        for (const lang of requiredLangs) {
          if (lang !== 'other') {
            for (const skill of skills) {
              if (typeof langData[lang][skill] !== 'boolean') {
                throw new Error(`Invalid language data for ${lang}.${skill}`);
              }
            }
          }
        }
        
        // ✅ Check 'other' has name field
        if (typeof langData.other.name !== 'string') {
          throw new Error('Other language must have a name');
        }
        
        return true;
      }),

    body('languageNotes')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Language notes too long'),

    // === DIETARY ===
    body('dietaryHabit')
      .notEmpty().withMessage('Dietary habit is required')
      .isIn(['Vegetarian', 'Non-Vegetarian', 'Both']).withMessage('Invalid dietary habit'),

    // === DOCUMENTS - FIXED ===
    body('idProofType')
      .notEmpty().withMessage('At least one ID proof is required')
      .custom((value) => {
        // ✅ Accept both array and JSON string
        let proofs = value;
        if (typeof value === 'string') {
          try {
            proofs = JSON.parse(value);
          } catch (e) {
            throw new Error('Invalid ID proof format');
          }
        }
        
        if (!Array.isArray(proofs) || proofs.length === 0) {
          throw new Error('At least one ID proof is required');
        }
        
        // ✅ Match MongoDB model enum values (exactly as in User.js)
        const validTypes = [
          'Driving License',
          'Voters ID Card',
          'NIN',
          'Organization ID-Card',
          'School Leaving Certificate',
          'Passport',
          'Election Card',
          'Others'
        ];
        
        // ✅ Check each proof against valid types (case-sensitive)
        for (const proof of proofs) {
          if (!validTypes.includes(proof)) {
            throw new Error(`Invalid ID proof type: "${proof}". Must be one of: ${validTypes.join(', ')}`);
          }
        }
        
        return true;
      }),

    // === EDUCATION - FIXED ===
    body('education')
      .notEmpty().withMessage('Education is required')
      .custom((value) => {
        // ✅ Accept both string and array
        let edu = value;
        if (typeof value === 'string') {
          try {
            edu = JSON.parse(value);
          } catch (e) {
            // If not JSON, treat as single value
            edu = [value];
          }
        }
        
        if (!Array.isArray(edu) || edu.length === 0) {
          throw new Error('At least one education level is required');
        }
        
        const validEducation = [
          'Primary', 'JSS', 'SSS', 'Graduation', 
          'Illiterate', 'University', 'PG', 'Other'
        ];
        
        for (const e of edu) {
          if (!validEducation.includes(e)) {
            throw new Error(`Invalid education level: "${e}"`);
          }
        }
        
        return true;
      }),

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