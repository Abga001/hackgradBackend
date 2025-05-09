// middleware/verifyToken.js - JWT Token verification middleware

const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token and extract user information
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const verifyToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  // Check if it has the Bearer format
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Invalid token format. Use "Bearer [token]"' });
  }

  // Extract the token without 'Bearer '
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify the token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request object
    req.user = verified;
    
    // Continue to the next middleware or route handler
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = verifyToken;