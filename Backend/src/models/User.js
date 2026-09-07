// models/User.js - COMPLETE FIXED VERSION (login bugs patched)

const mongoose = require('mongoose');

// === HELPER FUNCTIONS ===
function calculateAge(birthDate) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function generateInitials(firstName, middleName, lastName) {
  let initials = '';
  if (firstName) initials += firstName.charAt(0).toUpperCase();
  if (middleName) initials += middleName.charAt(0).toUpperCase();
  if (lastName) initials += lastName.charAt(0).toUpperCase();
  return initials || 'V';
}

const VolunteerSchema = new mongoose.Schema({
  // === VOLUNTEER IDENTIFICATION ===
  volunteerId: {
    type: String,
    unique: true,
    sparse: true,
  },
  initials: {
    type: String,
    maxlength: 10,
  },

  // === PROFILE PHOTO ===
  profilePhoto: {
    type: String,
    default: null
  },

  // === PERSONAL INFORMATION ===
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  middleName: {
    type: String,
    trim: true,
    maxlength: 50,
    default: ''
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },

  dateOfBirth: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        const age = calculateAge(value);
        return age >= 18;
      },
      message: 'Volunteer must be at least 18 years old'
    }
  },

  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },

  maritalStatus: {
    type: String,
    required: true,
    enum: ['Unmarried', 'Married']
  },

  // === LOCATION DETAILS ===
  stateOfOrigin: {
    type: String,
    required: true,
    trim: true
  },
  localGovernment: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  residentialAddress: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },

  // === CONTACT INFORMATION ===
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^0[0-9]{10}$/, 'Phone must start with 0 and be 11 digits']
  },
  alternatePhone: {
    type: String,
    trim: true,
    match: [/^0[0-9]{10}$/, 'Phone must start with 0 and be 11 digits'],
    default: ''
  },

  // === EMERGENCY CONTACT ===
  emergencyContactName: {
    type: String,
    required: true,
    trim: true
  },
  emergencyContactPhone: {
    type: String,
    required: true,
    trim: true,
    match: [/^0[0-9]{10}$/, 'Phone must start with 0 and be 11 digits']
  },

  // === LANGUAGES ===
  languages: {
    english: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      speak: { type: Boolean, default: false },
      understand: { type: Boolean, default: false }
    },
    yoruba: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      speak: { type: Boolean, default: false },
      understand: { type: Boolean, default: false }
    },
    igbo: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      speak: { type: Boolean, default: false },
      understand: { type: Boolean, default: false }
    },
    hausa: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      speak: { type: Boolean, default: false },
      understand: { type: Boolean, default: false }
    },
    other: {
      name: { type: String, default: '' },
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      speak: { type: Boolean, default: false },
      understand: { type: Boolean, default: false }
    }
  },
  languageNotes: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },

  // === DIETARY HABITS ===
  dietaryHabit: {
    type: String,
    required: true,
    enum: ['Vegetarian', 'Non-Vegetarian', 'Both']
  },

  // === DOCUMENTS ===
  idProofType: [{
    type: String,
    enum: [
      'Driving License',
      'Voters ID Card',
      'NIN',
      'Organization ID-Card',
      'School Leaving Certificate',
      'Passport',
      'Election Card',
      'Others'
    ]
  }],
  documents: [{
    type: String,
    default: []
  }],

  // === EDUCATION & OCCUPATION ===
  education: {
    type: String,
    required: true,
    enum: ['Primary', 'JSS', 'SSS', 'Graduation', 'Illiterate', 'University', 'PG', 'Other']
  },
  occupation: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },

  // === SYSTEM FIELDS ===
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: {
    type: String,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'volunteer', 'user'],
    default: 'volunteer'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'pending'
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // === LOGIN / LOCKOUT TRACKING ===
  // ✅ FIX: these fields were missing even though authController.login() and
  // authController.loginWithFingerprint() both call methods that depend on them
  // (user.isLocked, user.incrementLoginAttempts(), user.resetLoginAttempts(),
  // user.updateLastLogin()) — every login attempt threw a TypeError before this.
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  lastLoginAt: {
    type: Date,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// === PRE-SAVE HOOK - Generate Volunteer ID and Initials ===
VolunteerSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      // Generate Volunteer ID
      const count = await mongoose.model('User').countDocuments();
      const nextNumber = count + 1;
      this.volunteerId = String(nextNumber).padStart(4, '0');

      // Generate Initials
      this.initials = generateInitials(this.firstName, this.middleName, this.lastName);
    }

    this.updatedAt = new Date();
    next();
  } catch (error) {
    console.error('❌ Error in pre-save hook:', error);
    next(error);
  }
});

// === VIRTUALS ===
VolunteerSchema.virtual('fullName').get(function() {
  return [this.firstName, this.middleName, this.lastName]
    .filter(Boolean)
    .join(' ');
});

VolunteerSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  return calculateAge(this.dateOfBirth);
});

// ✅ FIX: added — authController.login() checks `user.isLocked` before this existed
VolunteerSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// === METHODS ===
VolunteerSchema.methods = {
  sanitize: function() {
    const user = this.toObject();
    delete user.__v;
    delete user.password;
    delete user.loginAttempts;
    delete user.lockUntil;
    return user;
  },

  // ✅ FIX: added — was called in login()/loginWithFingerprint() but never defined
  incrementLoginAttempts: async function() {
    // Reset the counter if a previous lock has already expired
    if (this.lockUntil && this.lockUntil < Date.now()) {
      this.loginAttempts = 1;
      this.lockUntil = null;
    } else {
      this.loginAttempts = (this.loginAttempts || 0) + 1;
      if (this.loginAttempts >= 5) {
        this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
      }
    }
    await this.save();
    return this;
  },

  // ✅ FIX: added
  resetLoginAttempts: async function() {
    this.loginAttempts = 0;
    this.lockUntil = null;
    await this.save();
    return this;
  },

  // ✅ FIX: added
  updateLastLogin: async function() {
    this.lastLoginAt = new Date();
    await this.save();
    return this;
  }
};

// === STATICS ===
VolunteerSchema.statics = {
  generateVolunteerId: async function() {
    const count = await this.countDocuments();
    return String(count + 1).padStart(4, '0');
  }
};

// === INDEXES ===
VolunteerSchema.index({ volunteerId: 1 }, { unique: true, sparse: true });
VolunteerSchema.index({ phone: 1 }, { unique: true });
VolunteerSchema.index({ email: 1 }, { unique: true, sparse: true });
VolunteerSchema.index({ status: 1 });
VolunteerSchema.index({ createdAt: -1 });

// ✅ FIX: was mongoose.model('Volunteer', ...), but Fingerprint.js, Session.js and
// AuditLog.js all declare `ref: 'User'`. Mongoose had no model registered under that
// name, so any .populate('userId') call (including the one in loginWithFingerprint())
// threw `MissingSchemaError: Schema hasn't been registered for model "User"`.
// Requiring this file as `const Volunteer = require('../models/User')` elsewhere is
// still fine — only the string passed to mongoose.model() below matters for `ref`.
module.exports = mongoose.model('User', VolunteerSchema);
