import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Circle } from 'lucide-react';
import AuthShell from './AuthShell';
import { Alert, Button, Input } from '../../components/ui';
import api, { errMsg, fieldErrors } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { passwordRules } from '../../utils/format';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const rules = passwordRules(password);

  const submit = async (e) => {
    e.preventDefault(); setError(null);
    if (password !== confirm) { setErrors({ confirm: 'Passwords do not match' }); return; }
    setBusy(true); setErrors({});
    try {
      const { data } = await api.post('/auth/reset-password', { token, password });
      toast.success(data.message); navigate('/login', { replace: true });
    } catch (err) { setErrors(fieldErrors(err)); setError(errMsg(err)); } finally { setBusy(false); }
  };

  if (!/^[a-f0-9]{64}$/.test(token)) {
    return <AuthShell title="Reset password"><Alert tone="danger" title="Invalid link">This reset link is missing or malformed. <Link to="/forgot-password">Request a new one</Link>.</Alert></AuthShell>;
  }
  return (
    <AuthShell title="Choose a new password" footer={<Link to="/login">Back to login</Link>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert tone="danger">{error} <Link to="/forgot-password" className="underline">Request a new link</Link></Alert>}
        <Input label="New password" name="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} required />
        <Input label="Confirm new password" name="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} required />
        <ul className="space-y-1 text-xs">{rules.map((r) => <li key={r.text} className={`flex items-center gap-1.5 ${r.ok ? 'text-ok' : 'text-muted'}`}>{r.ok ? <Check size={13} /> : <Circle size={11} />}{r.text}</li>)}</ul>
        <Button type="submit" className="w-full" loading={busy} disabled={rules.some((r) => !r.ok)}>Update password</Button>
      </form>
    </AuthShell>
  );
}
