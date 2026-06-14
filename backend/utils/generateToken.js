const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT for a given user ID.
 * The token is used to authenticate subsequent requests via the
 * Authorization header (Bearer token) or an httpOnly cookie.
 *
 * @param {string} userId - The MongoDB ObjectId of the user
 * @returns {string} signed JWT
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
