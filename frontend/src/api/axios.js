import axios from 'axios';

/**
 * Pre-configured Axios instance for all WorkHive API requests.
 *
 * - baseURL is read from the VITE_API_URL environment variable, falling
 *   back to the local backend URL during development.
 * - A request interceptor automatically attaches the JWT (if present in
 *   localStorage) to the Authorization header.
 * - A response interceptor catches 401 responses (expired/invalid token)
 *   and clears stored auth data so the user is redirected to login by
 *   the AuthContext / ProtectedRoute logic.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every outgoing request, if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('workhive_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired/invalid tokens globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('workhive_token');
      localStorage.removeItem('workhive_user');
    }
    return Promise.reject(error);
  }
);

export default api;
