import { Navigate, Outlet } from 'react-router-dom';
import { routes } from '../../config/routes';
import { useAuthContext } from '../../store/authContext';

export function ProtectedRoute() {
  const auth = useAuthContext();
  if (!auth.isAuthenticated) {
    return <Navigate to={routes.login} replace />;
  }
  return <Outlet />;
}
