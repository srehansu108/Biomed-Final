const mongoose = require('mongoose');

const FingerprintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fingerType: {
    type: String,
    enum: [
      'right_thumb', 'right_index', 'right_middle', 'right_ring', 'right_little',
      'left_thumb', 'left_index', 'left_middle', 'left_ring', 'left_little'
    ],
    required: true
  },
  templateHash: {
    type: String,
    required: true,
    index: true
  },
  templateEncrypted: {
    type: String,
    required: true
  },
  templateIv: {
    type: String,
    required: true
  },
  templateAuthTag: {
    type: String,
    required: true
  },
  templateFormat: {
    type: String,
    enum: ['ISO_19794_2', 'ANSI_378', 'MFS100', 'CUSTOM'],
    default: 'ISO_19794_2'
  },
  templateVersion: {
    type: String,
    default: '1.0'
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  qualityMetrics: {
    imageClarity: { type: Number, min: 0, max: 100 },
    minutiaePoints: { type: Number },
    livenessCheck: { type: Boolean, default: false },
    overallQuality: { type: Number, min: 0, max: 100 },
    nfiq: { type: Number, min: 1, max: 5 }, // NFIQ quality score
    capturedAt: { type: Date }
  },
  deviceInfo: {
    manufacturer: { type: String },
    model: { type: String },
    serialNumber: { type: String },
    firmwareVersion: { type: String },
    sdkVersion: { type: String }
  },
  captureEnvironment: {
    ambientLight: { type: String, enum: ['low', 'medium', 'high'] },
    temperature: { type: Number },
    humidity: { type: Number },
    pressure: { type: Number },
    timestamp: { type: Date, default: Date.now }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  expirationDate: {
    type: Date,
    default: null
  },
  verificationCount: {
    type: Number,
    default: 0
  },
  lastVerifiedAt: {
    type: Date,
    default: null
  },
  verificationHistory: [{
    timestamp: { type: Date, default: Date.now },
    result: { type: String, enum: ['success', 'failure'] },
    matchScore: { type: Number },
    ipAddress: { type: String },
    deviceId: { type: String }
  }],
  anomalyScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
FingerprintSchema.virtual('isExpired').get(function() {
  if (!this.expirationDate) return false;
  return this.expirationDate < new Date();
});

FingerprintSchema.virtual('qualityLabel').get(function() {
  if (this.qualityScore >= 85) return 'Excellent';
  if (this.qualityScore >= 70) return 'Good';
  if (this.qualityScore >= 50) return 'Fair';
  return 'Poor';
});

// Methods
FingerprintSchema.methods = {
  incrementVerification: async function(result, matchScore = null) {
    this.verificationCount += 1;
    this.lastVerifiedAt = new Date();
    
    if (result) {
      this.verificationHistory.push({
        timestamp: new Date(),
        result,
        matchScore,
        ipAddress: this._ipAddress || 'unknown'
      });
    }
    
    await this.save();
    return this;
  },

  sanitize: function() {
    const data = this.toObject();
    delete data.templateEncrypted;
    delete data.templateIv;
    delete data.templateAuthTag;
    delete data.__v;
    return data;
  },

  isQualityAcceptable: function() {
    return this.qualityScore >= 70 && this.anomalyScore < 30;
  }
};

// Statics
FingerprintSchema.statics = {
  findByUser: function(userId) {
    return this.find({ userId, isActive: true });
  },

  findByFingerType: function(userId, fingerType) {
    return this.findOne({ userId, fingerType, isActive: true });
  },

  findPrimary: function(userId) {
    return this.findOne({ userId, isPrimary: true, isActive: true });
  },

  countByUser: function(userId) {
    return this.countDocuments({ userId, isActive: true });
  },

  findActiveByUser: function(userId) {
    return this.find({ userId, isActive: true });
  },

  findExpired: function() {
    return this.find({
      expirationDate: { $lt: new Date() },
      isActive: true
    });
  }
};

// Indexes
FingerprintSchema.index({ userId: 1, fingerType: 1 }, { unique: true });
FingerprintSchema.index({ userId: 1, isPrimary: 1 });
FingerprintSchema.index({ templateHash: 1 });
FingerprintSchema.index({ expirationDate: 1 });
FingerprintSchema.index({ 'deviceInfo.serialNumber': 1 });
FingerprintSchema.index({ qualityScore: -1 });
FingerprintSchema.index({ anomalyScore: 1 });

module.exports = mongoose.model('Fingerprint', FingerprintSchema);