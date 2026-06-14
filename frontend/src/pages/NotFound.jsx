import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

/**
 * 404 Not Found page, shown for any unmatched route.
 */
const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <Logo className="h-9 w-auto" />
      <h1 className="mt-8 text-6xl font-semibold text-secondary">404</h1>
      <p className="mt-2 text-sm text-secondary/60">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
      >
        Back to home
      </Link>
    </div>
  );
};

export default NotFound;
