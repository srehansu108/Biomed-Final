// models/User.js - COMPLETE FIXED VERSION

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
    // ✅ REMOVED required: true - pre-save will generate this
  },
  initials: {
    type: String,
    maxlength: 10,
    // ✅ REMOVED required: true - pre-save will generate this
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
  console.log('🔧 Pre-save hook triggered');
  console.log('📋 Is new document?', this.isNew);
  
  try {
    if (this.isNew) {
      console.log('🆕 Generating Volunteer ID and Initials...');
      
      // Generate Volunteer ID
      const count = await mongoose.model('Volunteer').countDocuments();
      const nextNumber = count + 1;
      this.volunteerId = String(nextNumber).padStart(4, '0');
      console.log(`📋 Generated Volunteer ID: ${this.volunteerId}`);
      
      // Generate Initials
      this.initials = generateInitials(this.firstName, this.middleName, this.lastName);
      console.log(`🔤 Generated Initials: ${this.initials}`);
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

// === METHODS ===
VolunteerSchema.methods = {
  sanitize: function() {
    const user = this.toObject();
    delete user.__v;
    delete user.password;
    return user;
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

module.exports = mongoose.model('Volunteer', VolunteerSchema);