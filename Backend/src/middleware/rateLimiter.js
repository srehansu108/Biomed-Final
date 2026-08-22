const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.userId || req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    return sendError(res, 429, 'Too many requests, please try again later.');
  }
});

// Biometric-specific rate limiter (stricter)
const biometricLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    success: false,
    message: 'Too many biometric attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    return `${req.ip}-${req.userId || 'anonymous'}`;
  },
  handler: (req, res) => {
    return sendError(res, 429, 'Too many biometric attempts. Please try again in 15 minutes.');
  }
});

// Auth rate limiter (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    return sendError(res, 429, 'Too many authentication attempts. Please try again later.');
  }
});

// Admin rate limiter
const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 requests per hour
  message: {
    success: false,
    message: 'Too many admin requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.userId || req.ip;
  },
  handler: (req, res) => {
    return sendError(res, 429, 'Too many admin requests. Please try again later.');
  }
});

module.exports = { apiLimiter, biometricLimiter, authLimiter, adminLimiter };