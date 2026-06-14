import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BoardProvider } from './context/BoardContext';
import AppRoutes from './routes';

/**
 * App
 * Root component. Providers are ordered from outermost to innermost:
 *  1. BrowserRouter  – client-side routing
 *  2. AuthProvider   – global auth state (user, login, logout)
 *  3. BoardProvider  – global board & column state (Phase 2+)
 *
 * BoardProvider is nested inside AuthProvider so it can access
 * the authenticated user when needed in future phases.
 */
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BoardProvider>
          <AppRoutes />
        </BoardProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
