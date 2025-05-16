//User.js model
const mongoose = require("mongoose");

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// URL validation regex
const urlRegex = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

const userSchema = new mongoose.Schema({
  // Basic user information
  username: { type: String, required: true, trim: true, unique: true },
  fullName: { type: String, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    lowercase: true,
    validate: {
      validator: function(value) {
        return emailRegex.test(value);
      },
      message: 'Please provide a valid email address'
    }
  },
  password: { type: String, required: true },

  // Profile Details
  bio: { type: String, default: "", maxlength: 500 },
  profileImage: { type: String, default: "" },

  // Skills & Expertise
  skills: [{ type: String, trim: true }],
  areaOfExpertise: { type: String, default: "" },

  // Education & Experience
  education: [
    {
      institution: { type: String, trim: true },
      degree: { type: String, trim: true },
      fieldOfStudy: { type: String, trim: true },
      startYear: { 
        type: Number,
        min: 1900,
        max: new Date().getFullYear() + 10
      },
      endYear: { 
        type: Number,
        min: 1900,
        max: new Date().getFullYear() + 10,
        validate: {
          validator: function(value) {
            return !value || value >= this.startYear;
          },
          message: "End year must be greater than or equal to start year"
        }
      }
    }
  ],

  experience: [
    {
      company: { type: String, trim: true },
      position: { type: String, trim: true },
      startDate: { type: Date },
      endDate: { 
        type: Date,
        validate: {
          validator: function(value) {
            return !value || value >= this.startDate;
          },
          message: "End date must be greater than or equal to start date"
        }
      },
      description: { type: String, trim: true },
    }
  ],

  // 🔹 Favorite Programming Languages
  favoriteLanguages: [{ type: String, trim: true }],

  // 🔹 Social Links
  github: { 
    type: String, 
    default: "",
    validate: {
      validator: function(value) {
        return !value || urlRegex.test(value);
      },
      message: "Please provide a valid URL for your GitHub profile"
    }
  },
  linkedin: { 
    type: String, 
    default: "",
    validate: {
      validator: function(value) {
        return !value || urlRegex.test(value);
      },
      message: "Please provide a valid URL for your LinkedIn profile"
    }
  },
  portfolio: { 
    type: String, 
    default: "",
    validate: {
      validator: function(value) {
        return !value || urlRegex.test(value);
      },
      message: "Please provide a valid URL for your portfolio website"
    }
  },

  // Connections & Content
  connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // 
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Content" }],
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],

  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware: Update `updatedAt` before saving
userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Virtual property to get full profile URL
userSchema.virtual('profileUrl').get(function() {
  return `/profile/${this._id}`;
});

// Method to get public profile data (excluding password)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model("User", userSchema);
