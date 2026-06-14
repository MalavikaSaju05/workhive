const express = require('express');
const {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const {
  registerValidation,
  loginValidation,
} = require('../validations/authValidation');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidation, registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginValidation, loginUser);

// @route   GET /api/auth/me
// @desc    Get current logged-in user's profile
// @access  Private
router.get('/me', protect, getMe);

// @route   POST /api/auth/logout
// @desc    Logout current user
// @access  Private
router.post('/logout', protect, logoutUser);

module.exports = router;
