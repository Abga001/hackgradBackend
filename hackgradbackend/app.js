// Import necessary modules
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
require("dotenv/config");

// CORS Configuration - Expanded to handle various request types
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow both ports
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Configure uploads directory - Use the ACTUAL location where files are saved
const uploadsDir = path.join(__dirname, 'routes/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
}

// Debug log to confirm the directory being used
console.log('Serving static files from:', uploadsDir);
console.log('Resolved uploads path:', path.resolve(uploadsDir));

// Improved static file serving - Serve from where files are actually saved
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: function (res, path) {
    // Match CORS settings with your main config
    res.setHeader('Access-Control-Allow-Origin', 
      process.env.NODE_ENV === 'production' 
        ? 'https://your-production-domain.com' 
        : 'http://localhost:3001'  // Change to match your frontend
    );
    // rest of your code...
  }
}));

// Middleware to parse JSON requests with increased size limits
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '2mb' }));

// Add a file existence check endpoint
app.get('/api/check-file/:filename', (req, res) => {
  const filename = req.params.filename;
  
  // Security: Prevent directory traversal attacks
  if (filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ exists: false, error: 'Invalid filename' });
  }
  
  const filePath = path.join(uploadsDir, filename);
  const exists = fs.existsSync(filePath);
  
  res.json({ 
    exists, 
    path: exists ? `/uploads/${filename}` : null,
    fullUrl: exists ? `${req.protocol}://${req.get('host')}/uploads/${filename}` : null
  });
});

// Import main router that combines all routes
const routes = require("./routes");

// Route Middleware: Use the main router for all /api routes
app.use("/api", routes);

// Error handling middleware with improved error details
app.use((err, req, res, next) => {
  console.error('API Error:', {
    url: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });

  if (err.name === 'MulterError') {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        message: 'File is too large. Maximum file size is 5MB.' 
      });
    }
    return res.status(400).json({ 
      message: `File upload error: ${err.message}` 
    });
  } else if (err.name === 'CorsError' || err.message.includes('CORS')) {
    // CORS-related errors
    return res.status(403).json({
      message: 'Cross-Origin Request Blocked: CORS policy violation'
    });
  } else if (err.name === 'MongoError' || err.name === 'MongooseError') {
    // Database errors
    return res.status(500).json({
      message: 'Database operation failed. Please try again.'
    });
  }
  
  // An unknown error occurred
  return res.status(err.statusCode || 500).json({ 
    message: err.message || 'Server error during request' 
  });
});

// Connect to MongoDB using the connection string from .env
mongoose
  .connect(process.env.DB_CONNECTOR, { 
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
  })
  .then(() => {
    console.log("MongoDB connected successfully");
    
    // Drop the unique index on userId
    mongoose.connection.collections.cvprofiles.dropIndex('userId_1')
      .then(() => console.log('userId_1 index dropped successfully'))
      .catch(err => {
        // If error is "index not found", that's okay
        if(err.message.includes('index not found')) {
          console.log('Index was already removed or didn\'t exist');
        } else {
          console.error('Error dropping index:', err);
        }
      });
  })
  .catch((err) => console.error("MongoDB connection failed:", err));

// Start the server and listen on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));