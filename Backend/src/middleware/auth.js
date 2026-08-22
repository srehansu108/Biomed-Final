const JWTService = require('../services/jwtService');
const User = require('../models/User');
const { sendError } = require('../utils/response');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return sendError(res, 401, 'Authorization header required');
    }

    const token = JWTService.extractTokenFromHeader(authHeader);
    if (!token) {
      return sendError(res, 401, 'Invalid authorization format. Use Bearer token');
    }

    const decoded = JWTService.verifyToken(token);
    
    // Check if user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return sendError(res, 401, 'User not found');
    }

    // Check if user is active
    if (user.status === 'suspended') {
      return sendError(res, 403, 'Account suspended');
    }

    if (user.status === 'inactive') {
      return sendError(res, 403, 'Account inactive');
    }

    // Attach user to request
    req.userId = user._id;
    req.user = user;
    req.role = user.role;

    next();
  } catch (error) {
    if (error.message === 'Token expired') {
      return sendError(res, 401, 'Token expired');
    }
    if (error.message === 'Invalid token') {
      return sendError(res, 401, 'Invalid token');
    }
    return sendError(res, 401, error.message || 'Authentication failed');
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'User not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'You do not have permission to perform this action');
    }

    next();
  };
};

const isOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 401, 'User not authenticated');
  }

  const targetUserId = req.params.userId || req.params.id || req.body.userId;
  
  if (!targetUserId) {
    return sendError(res, 400, 'User ID is required');
  }

  if (req.user.role === 'admin' || req.user._id.toString() === targetUserId) {
    return next();
  }

  return sendError(res, 403, 'You can only access your own data');
};

// Enhanced auth with device fingerprinting
const authWithDevice = async (req, res, next) => {
  await auth(req, res, async () => {
    try {
      // Get device fingerprint from headers
      const deviceId = req.headers['x-device-id'];
      const deviceInfo = req.headers['x-device-info'] || 'Unknown';

      if (deviceId) {
        // Check if device is known
        if (req.user && req.user.deviceInfo) {
          const knownDevices = req.user.deviceInfo.registeredDevices || [];
          if (!knownDevices.includes(deviceId)) {
            // Add new device
            req.user.deviceInfo.registeredDevices.push(deviceId);
            await req.user.save();
          }
        }
      }

      next();
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  });
};

module.exports = { auth, authorize, isOwnerOrAdmin, authWithDevice };