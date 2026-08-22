const sendSuccess = (res, statusCode, message, data = null) => {
  const response = { success: true, message };
  if (data) response.data = data;
  res.status(statusCode).json(response);
};

const sendError = (res, statusCode, message, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  res.status(statusCode).json(response);
};

const sendValidationError = (res, errors) => {
  return sendError(res, 400, 'Validation failed', { errors });
};

const sendUnauthorized = (res, message = 'Unauthorized') => {
  return sendError(res, 401, message);
};

const sendForbidden = (res, message = 'Forbidden') => {
  return sendError(res, 403, message);
};

const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, 404, message);
};

const sendConflict = (res, message = 'Resource already exists') => {
  return sendError(res, 409, message);
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict
};