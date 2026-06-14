import api from '../api/axios';

/**
 * Authentication service.
 * Wraps all auth-related API calls in simple, reusable functions.
 * These are consumed by AuthContext so components never call axios directly.
 */

/**
 * Register a new user.
 * @param {{ name: string, email: string, password: string, confirmPassword: string }} data
 * @returns {Promise<{ user: object, token: string }>}
 */
export const registerRequest = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

/**
 * Log in an existing user.
 * @param {{ email: string, password: string }} data
 * @returns {Promise<{ user: object, token: string }>}
 */
export const loginRequest = async (data) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

/**
 * Fetch the currently authenticated user's profile.
 * Requires a valid token to already be attached via the axios interceptor.
 * @returns {Promise<{ user: object }>}
 */
export const getMeRequest = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

/**
 * Log out the current user (server-side endpoint for symmetry).
 * @returns {Promise<{ message: string }>}
 */
export const logoutRequest = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};
