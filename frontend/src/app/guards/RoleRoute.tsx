import { Navigate, Outlet } from 'react-router-dom';
import { routes } from '../../config/routes';
import { useAuthContext } from '../../store/authContext';

export function RoleRoute({ role }: { role: 'validator' | 'engineer' }) {
  const auth = useAuthContext();
  if (auth.user?.role !== role) {
    return <Navigate to={routes.unauthorized} replace />;
  }
  return <Outlet />;
}
