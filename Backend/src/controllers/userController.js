const User = require('../models/User');
const Fingerprint = require('../models/Fingerprint');
const Session = require('../models/Session');
const AuditService = require('../services/auditService');
const { sendSuccess, sendError } = require('../utils/response');
const { deleteProfileImage } = require('../middleware/upload');

class UserController {
  // Get user profile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.userId)
        .select('-loginAttempts -lockUntil -__v');
      
      if (!user) {
        return sendError(res, 404, 'User not found');
      }

      const fingerprints = await Fingerprint.find({
        userId: user._id,
        isActive: true
      });

      sendSuccess(res, 200, 'Profile retrieved', {
        user: user.sanitize(),
        fingerprints: fingerprints.map(f => f.sanitize())
      });
    } catch (error) {
      console.error('Get profile error:', error);
      sendError(res, 500, error.message);
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { fullName, phone, gender, address } = req.body;

      const user = await User.findById(req.userId);
      if (!user) {
        return sendError(res, 404, 'User not found');
      }

      if (phone) {
        const sanitizedPhone = phone.replace(/\D/g, '');
        const existingUser = await User.findOne({
          phone: sanitizedPhone,
          _id: { $ne: user._id }
        });
        if (existingUser) {
          return sendError(res, 409, 'Phone number already in use');
        }
        user.phone = sanitizedPhone;
      }

      if (fullName) user.fullName = fullName.trim();
      if (gender) user.gender = gender;
      if (address) user.address = address.trim();

      if (req.file) {
        if (user.profileImage) {
          deleteProfileImage(user.profileImage);
        }
        user.profileImage = req.file.path;
      }

      await user.save();

      await AuditService.log({
        userId: user._id,
        action: 'profile_update',
        status: 'success',
        req,
        details: { updatedFields: Object.keys(req.body) }
      });

      sendSuccess(res, 200, 'Profile updated successfully', user.sanitize());
    } catch (error) {
      console.error('Update profile error:', error);
      sendError(res, 500, error.message);
    }
  }

  // Get all users (Admin only)
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 10, search, status, role } = req.query;
      
      const query = {};
      if (status) query.status = status;
      if (role) query.role = role;
      
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [users, total] = await Promise.all([
        User.find(query)
          .select('-loginAttempts -lockUntil -__v')
          .skip(skip)
          .limit(parseInt(limit))
          .sort({ createdAt: -1 }),
        User.countDocuments(query)
      ]);

      sendSuccess(res, 200, 'Users retrieved', {
        users: users.map(u => u.sanitize()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      sendError(res, 500, error.message);
    }
  }

  // Get user by ID (Admin only)
  async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id)
        .select('-loginAttempts -lockUntil -__v');
      
      if (!user) {
        return sendError(res, 404, 'User not found');
      }

      const fingerprints = await Fingerprint.find({
        userId: user._id,
        isActive: true
      });

      sendSuccess(res, 200, 'User retrieved', {
        user: user.sanitize(),
        fingerprints: fingerprints.map(f => f.sanitize())
      });
    } catch (error) {
      console.error('Get user error:', error);
      sendError(res, 500, error.message);
    }
  }

  // Update user status (Admin only)
  async updateUserStatus(req, res) {
    try {
      const { status } = req.body;
      const validStatuses = ['active', 'inactive', 'suspended'];

      if (!validStatuses.includes(status)) {
        return sendError(res, 400, 'Invalid status');
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      ).select('-loginAttempts -lockUntil -__v');

      if (!user) {
        return sendError(res, 404, 'User not found');
      }

      await AuditService.log({
        userId: req.userId,
        action: 'profile_update',
        status: 'success',
        req,
        details: { userId: req.params.id, newStatus: status }
      });

      sendSuccess(res, 200, 'User status updated', user.sanitize());
    } catch (error) {
      console.error('Update status error:', error);
      sendError(res, 500, error.message);
    }
  }

  // Delete user (Admin only)
  async deleteUser(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return sendError(res, 404, 'User not found');
      }

      // Delete user's fingerprints
      await Fingerprint.deleteMany({ userId: user._id });
      
      // Delete user's sessions
      await Session.deleteMany({ userId: user._id });

      // Delete profile image
      if (user.profileImage) {
        deleteProfileImage(user.profileImage);
      }

      await user.deleteOne();

      await AuditService.log({
        userId: req.userId,
        action: 'fingerprint_delete',
        status: 'success',
        req,
        details: { deletedUserId: req.params.id }
      });

      sendSuccess(res, 200, 'User deleted successfully');
    } catch (error) {
      console.error('Delete user error:', error);
      sendError(res, 500, error.message);
    }
  }
}

module.exports = new UserController();