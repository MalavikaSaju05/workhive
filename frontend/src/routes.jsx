import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BoardView from './pages/BoardView';
import AnalyticsPage from './pages/AnalyticsPage';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

/**
 * Central route configuration for the WorkHive frontend.
 *
 * Public routes:
 *  - "/"          Landing page (redirects to /dashboard if already logged in)
 *  - "/login"     Login page
 *  - "/register"  Registration page
 *
 * Private routes (require authentication):
 *  - "/dashboard"   User dashboard — workspace overview (Phase 2)
 *  - "/board/:id"   Individual board view — columns & tasks (Phase 2/3)
 *
 * Fallback:
 *  - "*"  404 Not Found
 */
const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated && !loading ? <Navigate to="/dashboard" replace /> : <Landing />
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/board/:id" element={<BoardView />} />
        <Route path="/board/:id/analytics" element={<AnalyticsPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
