import { useLocation } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

/**
 * Catches backend redirects to /account and maps them to /accounts.
 * Extracted from AppRoutes.jsx.
 */
export default function AccountRedirectHandler() {
  const location = useLocation();
  const newPath = location.pathname.replace(/^\/account(\/|$)/, '/accounts$1');
  return <Navigate to={newPath + location.search + location.hash} replace />;
}
