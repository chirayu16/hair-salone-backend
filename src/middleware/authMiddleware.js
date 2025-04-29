const jwt = require('jsonwebtoken');
const User = require('../models/userModel.js'); // Ensure path is correct

const protect = async (req, res, next) => {
  let token;

  // Check if auth header exists and starts with Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token payload (ID) and ensure user still exists
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        // If token is valid but user doesn't exist (e.g., deleted account)
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // If token is valid and user exists, proceed to the next middleware/route handler
      next();

    } catch (error) {
      // This catches errors from jwt.verify (invalid token) or User.findById
      console.error('Authentication error in protect middleware:', error.message);
      // Send the response DIRECTLY, do not throw or call next()
      return res.status(401).json({ message: 'Not authorized, token failed or invalid' });
    }
  } else {
    // If no token or incorrect header format
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

const admin = (req, res, next) => {
  // Ensure protect middleware ran first and set req.user
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    // Send response directly
    return res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };