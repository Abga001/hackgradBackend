const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const verifyToken = require('../../middleware/verifyToken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ===== SETUP AND CONFIGURATION =====

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
};

// Setup multer for profile image uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// Create file filter for images
const imageFileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB size limit
  fileFilter: imageFileFilter
});

// Helper function to validate URLs
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// ===== CURRENT USER ROUTES =====

// Get current user's profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update current user's profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const updates = {
      fullName: req.body.fullName,
      bio: req.body.bio,
      profileImage: req.body.profileImage,
      skills: req.body.skills,
      areaOfExpertise: req.body.areaOfExpertise,
      education: req.body.education,
      experience: req.body.experience,
      favoriteLanguages: req.body.favoriteLanguages,
      github: req.body.github,
      linkedin: req.body.linkedin,
      portfolio: req.body.portfolio,
      updatedAt: new Date()
    };
    
    // Log the update attempt
    console.log(`Profile update attempt for user ${req.user._id}`);
    
    // Remove undefined fields
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });
    
    // Don't allow email or username changes through this route for security
    if (req.body.email) {
      delete updates.email;
    }
    
    if (req.body.username) {
      delete updates.username;
    }
    
    // Validate URL fields
    const urlFields = ['github', 'linkedin', 'portfolio'];
    const errors = [];
    
    urlFields.forEach(field => {
      if (updates[field] && !isValidUrl(updates[field])) {
        errors.push(`Invalid URL format for ${field}`);
      }
    });
    
    // Check image size (if it's a data URL)
    if (updates.profileImage && updates.profileImage.startsWith('data:image')) {
      // Roughly estimate the size of the base64 string (approx. 4/3 of the actual size)
      const approximateSize = updates.profileImage.length * 3/4;
      const sizeInMB = (approximateSize / 1024 / 1024).toFixed(2);
      
      if (approximateSize > 5 * 1024 * 1024) { // 5MB limit
        return res.status(400).json({ 
          message: `Profile image is too large (${sizeInMB}MB). Maximum size allowed is 5MB.` 
        });
      }
    }
    
    // If there are validation errors, return them
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`Profile updated successfully for user ${req.user._id}`);
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error('Error updating user profile:', err);
    
    // Check for validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ message: 'Validation error', errors: validationErrors });
    }
    
    // Check for other MongoDB errors
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid data format', error: err.message });
    }
    
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ===== USER PROFILE ROUTES =====

// Get user profile by ID (for public profiles)
router.get('/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -email'); // Don't expose private info
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get another user's profile
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("User profile fetch error:", err);
    res.status(500).json({ message: "Failed to fetch user profile" });
  }
});

// ===== SOCIAL INTERACTION ROUTES =====

// Follow a user
router.post("/follow/:userId", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const targetUserId = req.params.userId;

    if (!currentUser.connections.includes(targetUserId)) {
      currentUser.connections.push(targetUserId);
      await currentUser.save();
    }

    res.status(200).json({ message: "User followed successfully" });
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ message: "Failed to follow user" });
  }
});

// Unfollow a user
router.post("/unfollow/:userId", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const targetUserId = req.params.userId;

    currentUser.connections = currentUser.connections.filter(
      (id) => id.toString() !== targetUserId
    );

    await currentUser.save();
    res.status(200).json({ message: "User unfollowed successfully" });
  } catch (err) {
    console.error("Unfollow error:", err);
    res.status(500).json({ message: "Failed to unfollow user" });
  }
});

// Get current user's following list
router.get("/following", verifyToken, async (req, res) => {
  try {
    console.log("Fetching following list for user:", req.user._id);
    const user = await User.findById(req.user._id).populate("connections", "username fullName profileImage");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.connections);
  } catch (err) {
    console.error("Following fetch error:", err);
    res.status(500).json({ message: "Failed to get following list" });
  }
});

// Get a specific user's following list
router.get("/following/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Fetching following list for user: ${userId}`);
    
    const user = await User.findById(userId).populate("connections", "username fullName profileImage");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.connections);
  } catch (err) {
    console.error("Following fetch error:", err);
    res.status(500).json({ message: "Failed to get following list" });
  }
});

// Get user's followers
router.get("/followers/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Fetching followers for user: ${userId}`);
    
    const followers = await User.find({ connections: userId }).select("username fullName profileImage _id");
    
    res.status(200).json(followers);
  } catch (err) {
    console.error("Followers fetch error:", err);
    res.status(500).json({ message: "Failed to get followers list" });
  }
});

// ===== MEDIA ROUTES =====

// Upload profile image
router.post("/profile/image", verifyToken, upload.single('profileImage'), async (req, res) => {
  try {
    // req.file contains info about the uploaded file
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    // Get relative path to file that can be served by Express static middleware
    const relativePath = '/uploads/profiles/' + req.file.filename;
    
    // Update user with image URL
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: relativePath },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      message: 'Profile image updated successfully',
      profileImage: relativePath,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ message: 'Server error uploading profile image' });
  }
});

module.exports = router;