const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  accessToken: {
    type: String,
    required: true,
    unique: true
  },
  refreshToken: {
    type: String,
    required: true,
    unique: true
  },
  deviceInfo: {
    type: {
      userAgent: String,
      platform: String,
      browser: String,
      version: String,
      ipAddress: String
    },
    default: {}
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  refreshExpiresAt: {
    type: Date,
    required: true,
    index: true
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  terminatedAt: {
    type: Date,
    default: null
  },
  terminationReason: {
    type: String,
    enum: ['logout', 'expired', 'revoked', 'security'],
    default: null
  }
}, {
  timestamps: true
});

// Methods
SessionSchema.methods = {
  isExpired: function() {
    return this.expiresAt < new Date();
  },

  isRefreshExpired: function() {
    return this.refreshExpiresAt < new Date();
  },

  terminate: async function(reason = 'logout') {
    this.isActive = false;
    this.terminatedAt = new Date();
    this.terminationReason = reason;
    await this.save();
    return this;
  },

  updateActivity: async function() {
    this.lastActivity = new Date();
    await this.save();
    return this;
  },

  sanitize: function() {
    const data = this.toObject();
    delete data.accessToken;
    delete data.refreshToken;
    delete data.__v;
    return data;
  }
};

// Statics
SessionSchema.statics = {
  findByUser: function(userId) {
    return this.find({ userId, isActive: true });
  },

  findActive: function() {
    return this.find({
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
  },

  deleteExpired: function() {
    return this.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { refreshExpiresAt: { $lt: new Date() } }
      ]
    });
  },

  cleanupOldSessions: function(days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return this.deleteMany({
      $or: [
        { createdAt: { $lt: cutoff }, isActive: false },
        { terminatedAt: { $lt: cutoff } }
      ]
    });
  }
};

// Indexes
SessionSchema.index({ accessToken: 1 }, { unique: true });
SessionSchema.index({ refreshToken: 1 }, { unique: true });
SessionSchema.index({ userId: 1, isActive: 1 });
SessionSchema.index({ expiresAt: 1 });
SessionSchema.index({ refreshExpiresAt: 1 });

module.exports = mongoose.model('Session', SessionSchema);