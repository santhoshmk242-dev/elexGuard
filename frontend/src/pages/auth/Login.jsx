import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import AuthShell from './AuthShell';
import { Alert, Button, Input } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { errCode, errMsg, fieldErrors } from '../../services/api';

export default function Login({ admin = false }) {
  const { login, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [errors, setErrors] = useState({});

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/voter'} replace />;

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(null); setNeedsVerify(false); setErrors({});
    try {
      const u = await login(form.email.trim(), form.password, admin);
      toast.success(`Welcome back, ${u.fullName.split(' ')[0]}.`);
      const from = location.state?.from;
      const ok = from && ((u.role === 'admin' && from.startsWith('/admin')) || (u.role === 'voter' && from.startsWith('/voter')));
      navigate(ok ? from : (u.role === 'admin' ? '/admin' : '/voter'), { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errMsg(err));
      if (errCode(err) === 'EMAIL_NOT_VERIFIED') setNeedsVerify(true);
    } finally { setBusy(false); }
  };

  return (
    <AuthShell title={admin ? 'Administrator login' : 'Voter login'} subtitle={admin ? 'Restricted area – authorised election staff only.' : 'Access your voter dashboard and ballots.'}
      footer={admin ? <Link to="/login">Voter login →</Link> : <>New voter? <Link to="/register">Register here</Link> · <Link to="/admin/login">Administrator login</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert tone="danger">{error}{needsVerify && <> <Link to="/verify-otp" state={{ email: form.email }} className="font-medium underline">Verify your email now</Link>.</>}</Alert>}
        <Input label="Email address" name="email" type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} required />
        <div>
          <div className="relative">
            <Input label="Password" name="password" type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} required />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-[34px] text-muted hover:text-ink">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          <div className="mt-1 text-right"><Link to="/forgot-password" className="text-xs">Forgot password?</Link></div>
        </div>
        <Button type="submit" className="w-full" loading={busy}>{admin ? 'Sign in to console' : 'Log in'}</Button>
      </form>
    </AuthShell>
  );
}
