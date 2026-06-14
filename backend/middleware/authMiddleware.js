const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError } = require('./errorMiddleware');

/**
 * Protects routes by verifying the JWT supplied in the
 * `Authorization: Bearer <token>` header. If valid, attaches the
 * authenticated user (without password) to `req.user` and calls next().
 * Otherwise, throws a 401 error which is handled by the global
 * error handler.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Authorization: "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to the request, excluding the password field
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        throw new ApiError(401, 'User belonging to this token no longer exists');
      }

      return next();
    } catch (error) {
      return next(new ApiError(401, 'Not authorized, token invalid or expired'));
    }
  }

  if (!token) {
    return next(new ApiError(401, 'Not authorized, no token provided'));
  }
};

module.exports = { protect };
