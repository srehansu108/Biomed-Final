const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'register', 'login', 'logout',
      'fingerprint_capture', 'fingerprint_verify', 'fingerprint_delete',
      'profile_update', 'profile_delete',
      'user_create', 'user_update', 'user_delete', 'user_suspend',
      'admin_action', 'system_action',
      'security_alert', 'anomaly_detected'
    ]
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'failure', 'pending', 'warning']
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: '0.0.0.0'
  },
  userAgent: {
    type: String,
    default: 'Unknown'
  },
  location: {
    country: { type: String },
    city: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  deviceId: {
    type: String,
    default: null
  },
  sessionId: {
    type: String,
    default: null
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  capped: { size: 1024 * 1024 * 100, max: 100000 } // 100MB, 100k documents
});

// Methods
AuditLogSchema.methods = {
  sanitize: function() {
    const data = this.toObject();
    delete data.__v;
    return data;
  }
};

// Statics
AuditLogSchema.statics = {
  findByUser: function(userId, limit = 50, skip = 0) {
    return this.find({ userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
  },

  findByAction: function(action, limit = 50) {
    return this.find({ action })
      .sort({ timestamp: -1 })
      .limit(limit);
  },

  findRecent: function(limit = 100) {
    return this.find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'fullName email');
  },

  countByStatus: function(status) {
    return this.countDocuments({ status });
  },

  getStats: function() {
    return this.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          success: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          failure: {
            $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }
};

// Indexes
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, status: 1 });
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ severity: 1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);