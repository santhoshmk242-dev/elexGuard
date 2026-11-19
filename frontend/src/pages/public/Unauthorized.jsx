import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
export default function Unauthorized() {
  const { user } = useAuth();
  return (
    <div className="container-x section text-center">
      <ShieldAlert size={56} className="mx-auto text-danger" />
      <h1 className="mt-3">Access denied</h1>
      <p className="mt-2 text-muted">You do not have permission to view this page.</p>
      <Link to={user ? (user.role === 'admin' ? '/admin' : '/voter') : '/login'} className="btn-primary mt-6 no-underline">{user ? 'Go to my dashboard' : 'Log in'}</Link>
    </div>
  );
}
