const crypto = require('crypto');

// Generate random ID
const generateId = (prefix = '') => {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// Format date
const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calculate age from date
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Truncate text
const truncateText = (text, length = 50) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Validate URL
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Extract IP from request
const getClientIp = (req) => {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         '0.0.0.0';
};

// Extract user agent
const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'Unknown';
};

// Sanitize object (remove undefined, null, empty strings)
const sanitizeObject = (obj) => {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value;
    }
  }
  return result;
};

// Mask sensitive data
const maskSensitive = (data) => {
  if (!data) return data;
  const string = String(data);
  if (string.length <= 4) return '***';
  return string.slice(0, 2) + '***' + string.slice(-2);
};

module.exports = {
  generateId,
  formatDate,
  calculateAge,
  truncateText,
  isValidUrl,
  getClientIp,
  getUserAgent,
  sanitizeObject,
  maskSensitive
};