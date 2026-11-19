import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullPageSpinner } from './ui';

/** Frontend route guard. The backend independently enforces every permission – this only improves UX. */
export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} state={{ from: location.pathname }} replace />;
  if (role && user.role !== role) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
