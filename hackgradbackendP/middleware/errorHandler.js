// middleware/errorHandler.js - Centralized error handling

/**
 * Global error handling middleware for Express
 * Formats error responses and handles different error types
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} JSON response with error details
 */
const errorHandler = (err, req, res, next) => {
    // Log error details (not visible to client)
    console.error('API Error:', {
      url: req.originalUrl,
      method: req.method,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    });
    
    // Handle different error types
    if (err.name === 'ValidationError') {
      // Mongoose validation error
      const validationErrors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    if (err.name === 'CastError') {
      // Mongoose cast error (usually invalid ObjectId)
      return res.status(400).json({
        status: 'error',
        message: 'Invalid data format',
        detail: err.message
      });
    }
    
    if (err.name === 'MulterError') {
      // File upload errors
      const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      const message = err.code === 'LIMIT_FILE_SIZE' 
        ? 'File is too large. Maximum file size is 5MB.'
        : `File upload error: ${err.message}`;
        
      return res.status(statusCode).json({
        status: 'error',
        message: message
      });
    }
    
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      // JWT token errors
      return res.status(401).json({
        status: 'error',
        message: err.name === 'TokenExpiredError' 
          ? 'Your session has expired. Please log in again.'
          : 'Invalid authentication token.'
      });
    }
    
    // Default error response for unhandled error types
    res.status(err.statusCode || 500).json({
      status: 'error',
      message: err.message || 'An unexpected error occurred',
      errorCode: err.errorCode || 'INTERNAL_SERVER_ERROR'
    });
  };
  
  module.exports = errorHandler;