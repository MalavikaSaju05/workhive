import { createContext, useState, useEffect, useContext } from 'react';
import {
  loginRequest,
  registerRequest,
  getMeRequest,
  logoutRequest,
} from '../services/authService';
import { connectSocket, disconnectSocket } from '../services/socket';

/**
 * AuthContext provides global access to:
 *  - the current authenticated user (or null)
 *  - loading state while the initial session check runs
 *  - login / register / logout functions
 *
 * Token and user data are persisted to localStorage so the session
 * survives page refreshes. On mount, if a token exists, we verify it
 * by calling GET /api/auth/me.
 */
const AuthContext = createContext(null);

const TOKEN_KEY = 'workhive_token';
const USER_KEY = 'workhive_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // On initial app load, check if a token already exists and validate it
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (!token) {
        setLoading(false);
        return;
      }

      // Optimistically set the cached user while we verify in the background
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          /* ignore corrupted cache */
        }
      }

      try {
        const { user: freshUser } = await getMeRequest();
        setUser(freshUser);
        localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        connectSocket(token);
      } catch {
        // Token invalid/expired - clear everything
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Registers a new user, stores the returned token/user, and updates state.
   */
  const register = async (formData) => {
    setError(null);
    try {
      const { user: newUser, token } = await registerRequest(formData);
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      setUser(newUser);
      connectSocket(token);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      return { success: false, message };
    }
  };

  /**
   * Logs in an existing user, stores the returned token/user, and updates state.
   */
  const login = async (formData) => {
    setError(null);
    try {
      const { user: loggedInUser, token } = await loginRequest(formData);
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      connectSocket(token);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || 'Invalid email or password.';
      setError(message);
      return { success: false, message };
    }
  };

  /**
   * Logs out the current user: clears local storage and state,
   * and notifies the backend (best-effort).
   */
  const logout = async () => {
    try {
      await logoutRequest();
    } catch {
      /* ignore network errors on logout */
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      disconnectSocket();
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Convenience hook for consuming AuthContext.
 * Throws an error if used outside of AuthProvider to catch bugs early.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
