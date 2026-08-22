const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { userValidator } = require('../validators/userValidator');
const { handleUpload } = require('../middleware/upload');
const { adminLimiter } = require('../middleware/rateLimiter');

router.get('/profile', auth, UserController.getProfile);
router.put(
  '/profile',
  auth,
  handleUpload,
  validate(userValidator.updateProfile),
  UserController.updateProfile
);

// Admin only routes
router.get(
  '/',
  auth,
  authorize('admin'),
  adminLimiter,
  UserController.getUsers
);

router.get(
  '/:id',
  auth,
  authorize('admin'),
  validate(userValidator.getById),
  UserController.getUserById
);

router.patch(
  '/:id/status',
  auth,
  authorize('admin'),
  validate(userValidator.updateStatus),
  UserController.updateUserStatus
);

router.delete(
  '/:id',
  auth,
  authorize('admin'),
  validate(userValidator.getById),
  UserController.deleteUser
);

module.exports = router;