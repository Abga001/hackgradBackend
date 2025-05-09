// index.js - Router that combines all content-related routes

const express = require('express');
const router = express.Router();

// Import content sub-routers
const contentRoutes = require('./contentRoutes');
const interactionRoutes = require('./interactionRoutes');
const questionRoutes = require('./questionRoutes');


// Interaction routes (likes, comments, saves, reposts)
router.use('/', interactionRoutes);

// Question-specific routes - mount at /questions path
router.use('/questions', questionRoutes);

// Static routes
router.use('/', contentRoutes);

console.log('Mounting interaction routes...');
router.use('/', (req, res, next) => {
  console.log(`Content route: ${req.method} ${req.path}`);
  next();
}, interactionRoutes);


module.exports = router;