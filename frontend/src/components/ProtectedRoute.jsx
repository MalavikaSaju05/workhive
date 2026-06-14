import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 *
 * Wraps private routes (e.g. Dashboard) and redirects unauthenticated
 * users to the login page. While the initial auth check is in progress
 * (e.g. validating a stored token on page refresh), it shows a simple
 * full-screen loading state instead of immediately redirecting, to
 * avoid flashing the login page for already-logged-in users.
 *
 * Usage (in routes.jsx):
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/dashboard" element={<Dashboard />} />
 * </Route>
 */
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-primary" />
          <p className="text-sm text-secondary/60">Loading WorkHive...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve the intended destination so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
