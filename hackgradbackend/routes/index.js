const express = require('express');
const router = express.Router();

// Import sub-routers
const authRoutes = require('./auth/authRoutes');
const contentRoutes = require('./content');
const userRoutes = require('./user/userRoutes');
const searchRoutes = require('./search/searchRoutes');
const uploadRoutes = require('./upload/uploadRoutes');
const cvProfileRoutes = require('./cv/cvRoutes'); // Import CV routes

// Apply all routes
// Auth Routes
router.use('/user', authRoutes); // Authentication routes (login, register, etc.)

// Content Routes (combined in content/index.js)
router.use('/contents', contentRoutes);

// User Profile Routes
router.use('/user', userRoutes); // Profile operations - using the same base path as auth

// Search Routes
router.use('/search', searchRoutes);

// Upload Routes
router.use('/uploads', uploadRoutes);

// CV Profile Routes
router.use('/cv-profile', cvProfileRoutes); // Mount CV routes

module.exports = router;