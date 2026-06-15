/**
 * Convenience API routes mounted directly at /api.
 *
 * These aliases exist for backward compatibility with frontend clients
 * that call /api/login, /api/register, etc. directly, without the
 * /api/auth prefix. They delegate to the same controller functions and
 * validation middleware as the canonical /api/auth/* routes, so
 * behaviour is identical.
 *
 * Canonical routes (unchanged):
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   GET  /api/auth/me
 *   POST /api/auth/logout
 *
 * Convenience aliases added here:
 *   POST /api/register  → registerUser
 *   POST /api/login     → loginUser
 *   GET  /api/me        → getMe
 *   POST /api/logout    → logoutUser
 */

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

// @route   POST /api/register
// @desc    Register a new user (alias for /api/auth/register)
// @access  Public
router.post('/register', registerValidation, registerUser);

// @route   POST /api/login
// @desc    Authenticate user & get token (alias for /api/auth/login)
// @access  Public
router.post('/login', loginValidation, loginUser);

// @route   GET /api/me
// @desc    Get current logged-in user's profile (alias for /api/auth/me)
// @access  Private
router.get('/me', protect, getMe);

// @route   POST /api/logout
// @desc    Logout current user (alias for /api/auth/logout)
// @access  Private
router.post('/logout', protect, logoutUser);

module.exports = router;
