const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { validate } = require('../middleware/validation');
const { authValidator } = require('../validators/authValidator');
const { authLimiter } = require('../middleware/rateLimiter');

router.post(
  '/register',
  authLimiter,
  validate(authValidator.register),
  AuthController.register.bind(AuthController)
);

router.post(
  '/login',
  authLimiter,
  validate(authValidator.login),
  AuthController.login.bind(AuthController)
);

router.post(
  '/logout',
  AuthController.logout.bind(AuthController)
);

router.post(
  '/refresh-token',
  authLimiter,
  validate(authValidator.refreshToken),
  AuthController.refreshToken.bind(AuthController)
);

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working!' });
});

module.exports = router;