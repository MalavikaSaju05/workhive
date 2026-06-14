import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import NotificationDropdown from './NotificationDropdown';

/**
 * Top navigation bar.
 * Shows different links depending on authentication state:
 *  - Logged out: Login / Get Started buttons
 *  - Logged in: user greeting + Logout button
 */
const Navbar = () => {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const navigate = useNavigate();

  // While the initial session check is running, treat the user as logged
  // out so the navbar doesn't briefly flash "Hi, {name}" with stale cached
  // data before the token has actually been verified.
  const showAuthenticatedUI = isAuthenticated && !loading;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Logo className="h-8 w-auto" />

        {showAuthenticatedUI ? (
          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <span className="hidden text-sm text-secondary/70 sm:inline">
              Hi, {user?.name?.split(' ')[0]}
            </span>
            <Link
              to="/dashboard"
              className="rounded-lg px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-accent"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-accent"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
