// CVProfile.js - model
const mongoose = require('mongoose');

const CVProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Add fullName field directly to CV Profile
  title: {
    type: String,
    default: 'My CV'
  },
  fullName: {
    type: String,
    trim: true
  },
  // Add profileImage field to store the image
  profileImage: {
    type: String,
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  headline: {
    type: String,
    maxlength: 150
  },
  summary: {
    type: String,
    maxlength: 1000
  },
  contact: {
    email: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  workExperience: [{
    title: {
      type: String,
      required: true
    },
    company: {
      type: String,
      required: true
    },
    location: String,
    startDate: Date,
    endDate: Date,
    current: {
      type: Boolean,
      default: false
    },
    description: String,
    highlights: [String],
    technologies: [String]
  }],
  education: [{
    institution: {
      type: String,
      required: true
    },
    degree: String,
    fieldOfStudy: String,
    startYear: Number,
    endYear: Number,
    current: {
      type: Boolean,
      default: false
    },
    description: String,
    achievements: [String]
  }],
  skills: [{
    name: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Intermediate'
    },
    yearsOfExperience: Number
  }],
  languages: [{
    name: {
      type: String,
      required: true
    },
    proficiency: {
      type: String,
      enum: ['Elementary', 'Limited Working', 'Professional Working', 'Full Professional', 'Native/Bilingual'],
      default: 'Professional Working'
    }
  }],
  certifications: [{
    name: {
      type: String,
      required: true
    },
    issuer: String,
    date: Date,
    expires: Date,
    hasExpiry: {
      type: Boolean,
      default: false
    },
    credentialId: String,
    credentialURL: String
  }],
  projects: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    startDate: Date,
    endDate: Date,
    current: {
      type: Boolean,
      default: false
    },
    url: String,
    repositoryUrl: String,
    technologies: [String],
    highlights: [String]
  }],
  publications: [{
    title: {
      type: String,
      required: true
    },
    publisher: String, 
    date: Date,
    url: String,
    description: String
  }],
  customSections: [{
    title: {
      type: String,
      required: true
    },
    items: [{
      title: String,
      subtitle: String,
      date: Date,
      description: String,
      url: String
    }]
  }],
  theme: {
    primaryColor: {
      type: String,
      default: '#4e54c8'
    },
    secondaryColor: {
      type: String,
      default: '#8f94fb'
    },
    fontFamily: {
      type: String,
      default: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    },
    layout: {
      type: String,
      enum: ['standard', 'modern', 'creative', 'minimal'],
      default: 'standard'
    }
  },
  displayOptions: {
    showProfileImage: {
      type: Boolean,
      default: true
    },
    showContact: {
      type: Boolean,
      default: true
    },
    sectionsOrder: {
      type: [String],
      default: ['summary', 'workExperience', 'education', 'skills', 'projects', 'certifications', 'languages', 'publications', 'customSections']
    },
    hiddenSections: {
      type: [String],
      default: []
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, 
{
  timestamps: true
});

CVProfileSchema.pre('save', async function(next) {
  if (this.isDefault) {
    // If this CV is being set as default, remove default status from other CVs
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

module.exports = mongoose.model('CVProfile', CVProfileSchema);