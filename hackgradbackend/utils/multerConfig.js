// multerConfig.js - Centralized multer configuration

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for content uploads
const configureStorage = (destination) => {
  const uploadDir = path.join(__dirname, '..', destination);
  
  // Create upload directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExt = path.extname(file.originalname);
      cb(null, 'upload-' + uniqueSuffix + fileExt);
    }
  });
};

// Create file filter for images
const imageFileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create different upload configurations
const contentUpload = multer({ 
  storage: configureStorage('uploads'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFileFilter
});

const profileUpload = multer({ 
  storage: configureStorage('uploads/profiles'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFileFilter
});

const generalUpload = multer({ 
  storage: configureStorage('uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = {
  contentUpload,
  profileUpload,
  generalUpload
};