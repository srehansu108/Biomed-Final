const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^[0-9]{10}$/, 'Phone must be 10 digits']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    default: 'Prefer not to say'
  },
  address: {
    type: String,
    trim: true,
    maxlength: 500
  },
  profileImage: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['admin', 'employee', 'user'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification'],
    default: 'pending_verification'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  preferences: {
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'en' },
    notifications: { type: Boolean, default: true }
  },
  deviceInfo: {
    lastDevice: { type: String },
    registeredDevices: [{ type: String }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
UserSchema.virtual('isLocked').get(function() {
  if (!this.lockUntil) return false;
  return this.lockUntil > new Date();
});

UserSchema.virtual('fullProfile').get(function() {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    gender: this.gender,
    role: this.role,
    status: this.status,
    isVerified: this.isVerified,
    profileImage: this.profileImage
  };
});

// Methods
UserSchema.methods = {
  incrementLoginAttempts: async function() {
    this.loginAttempts += 1;
    
    if (this.loginAttempts >= 5) {
      this.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
    
    await this.save();
    return this;
  },

  resetLoginAttempts: async function() {
    this.loginAttempts = 0;
    this.lockUntil = null;
    await this.save();
    return this;
  },

  updateLastLogin: async function() {
    this.lastLogin = new Date();
    await this.save();
    return this;
  },

  sanitize: function() {
    const user = this.toObject();
    delete user.loginAttempts;
    delete user.lockUntil;
    delete user.__v;
    return user;
  }
};

// Statics
UserSchema.statics = {
  findByEmail: function(email) {
    return this.findOne({ email: email.toLowerCase() });
  },

  findByPhone: function(phone) {
    return this.findOne({ phone: phone.replace(/\D/g, '') });
  },

  findActive: function() {
    return this.find({ status: 'active' });
  },

  countActive: function() {
    return this.countDocuments({ status: 'active' });
  }
};

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true });
UserSchema.index({ status: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', UserSchema);