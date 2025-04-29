const express = require('express');
const passport = require('passport');
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  googleCallback 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Register route
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);

// Get profile route
router.get('/profile', protect, getUserProfile);

// Google OAuth routes
router.get("/google", (req, res, next) => {
  if (req.query.callbackUrl) {
    req.session.callbackUrl = req.query.callbackUrl;
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next
  );
});

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
);

module.exports = router;