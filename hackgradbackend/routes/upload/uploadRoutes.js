// uploadRoutes.js - Updated to save files to the correct location

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const verifyToken = require('../../middleware/verifyToken');

const router = express.Router();

// Points to the correct uploads directory where files should actually be saved
const uploadsDir = path.join(__dirname, '../uploads'); // This points to /routes/uploads/

// Create directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Debug: Log the actual path being used
console.log('Files will be saved to:', uploadsDir);
console.log('Resolved path:', path.resolve(uploadsDir));

// Storage configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    console.log('Saving file to:', uploadsDir); // Debug log
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    const uniqueSuffix = timestamp + '-' + randomSuffix;
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFileFilter
});

/**
 * @route   POST /api/uploads
 * @desc    Upload a file
 * @access  Private
 * @returns {object} Object with the uploaded file URL
 */
router.post('/', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Return the relative path to the file (matching the serving location)
  res.json({ 
    imageUrl: `/uploads/${req.file.filename}`,
    message: 'File uploaded successfully'
  });
});

/**
 * @route   POST /api/uploads/multiple
 * @desc    Upload multiple files
 * @access  Private
 * @returns {object} Array of URLs for the uploaded files
 */
router.post('/multiple', verifyToken, upload.array('images', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  // Return array of relative paths to the files
  const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
  
  res.json({ 
    imageUrls,
    message: `${req.files.length} files uploaded successfully`
  });
});

module.exports = router;