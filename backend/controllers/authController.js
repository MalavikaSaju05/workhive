const { validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { ApiError } = require('../middleware/errorMiddleware');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 *
 * Request body:
 * {
 *   "name": "Jane Doe",
 *   "email": "jane@example.com",
 *   "password": "secret123",
 *   "confirmPassword": "secret123"
 * }
 *
 * Success response (201):
 * {
 *   "success": true,
 *   "user": { "_id": "...", "name": "...", "email": "...", "avatar": "" },
 *   "token": "<jwt>"
 * }
 */
const registerUser = async (req, res, next) => {
  try {
    // Run express-validator checks
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }

    const { name, email, password } = req.body;

    // Prevent duplicate accounts (also enforced at the DB level via unique index)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, 'An account with this email already exists');
    }

    // Password hashing happens automatically via the pre('save') hook on User model
    const user = await User.create({ name, email, password });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      user: user.toSafeObject(),
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate a user and return a JWT
 * @route   POST /api/auth/login
 * @access  Public
 *
 * Request body:
 * {
 *   "email": "jane@example.com",
 *   "password": "secret123"
 * }
 *
 * Success response (200):
 * {
 *   "success": true,
 *   "user": { "_id": "...", "name": "...", "email": "...", "avatar": "" },
 *   "token": "<jwt>"
 * }
 */
const loginUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }

    const { email, password } = req.body;

    // Explicitly select password since it's excluded by default in the schema
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      user: user.toSafeObject(),
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the currently authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Private (requires valid JWT)
 *
 * Success response (200):
 * {
 *   "success": true,
 *   "user": { "_id": "...", "name": "...", "email": "...", "avatar": "" }
 * }
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the `protect` middleware
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.status(200).json({
      success: true,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout the current user
 * @route   POST /api/auth/logout
 * @access  Private
 *
 * Since JWTs are stateless and stored client-side, logout is handled
 * primarily on the frontend (clearing the token from storage/state).
 * This endpoint exists for symmetry, to allow future blacklist/session
 * logic, and to give the client a clear success response to act on.
 *
 * Success response (200):
 * { "success": true, "message": "Logged out successfully" }
 */
const logoutUser = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser, getMe, logoutUser };
