// server/src/middleware/validation.js
const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

// ✅ Fixed: Handle undefined, null, or non-array validations
const validate = (validations) => {
  return async (req, res, next) => {
    try {
      // ✅ Check if validations exist and is an array
      if (!validations || !Array.isArray(validations)) {
        console.warn('⚠️ Validation middleware called without validations array');
        // Skip validation and continue
        return next();
      }

      // Run all validations
      for (const validation of validations) {
        if (validation && typeof validation.run === 'function') {
          await validation.run(req);
        }
      }

      // Check for validation errors
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      // Format errors
      const formattedErrors = errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }));

      return sendError(res, 400, 'Validation failed', { errors: formattedErrors });
    } catch (error) {
      console.error('❌ Validation error:', error);
      return sendError(res, 500, 'Validation middleware error');
    }
  };
};

const validateBody = (schema) => {
  return (req, res, next) => {
    if (!schema) {
      console.warn('⚠️ validateBody called without schema');
      return next();
    }

    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (!error) {
      return next();
    }

    const errors = error.details.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      value: err.context?.value
    }));

    return sendError(res, 400, 'Validation failed', { errors });
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    if (!schema) {
      console.warn('⚠️ validateParams called without schema');
      return next();
    }

    const { error } = schema.validate(req.params, { abortEarly: false });
    
    if (!error) {
      return next();
    }

    const errors = error.details.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));

    return sendError(res, 400, 'Invalid parameters', { errors });
  };
};

module.exports = { validate, validateBody, validateParams };