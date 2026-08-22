const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    for (const validation of validations) {
      await validation.run(req);
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
  };
};

const validateBody = (schema) => {
  return (req, res, next) => {
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