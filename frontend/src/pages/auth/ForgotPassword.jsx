import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from './AuthShell';
import { Alert, Button, Input } from '../../components/ui';
import api, { errMsg, fieldErrors } from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(null); setErrors({});
    try { const { data } = await api.post('/auth/forgot-password', { email: email.trim() }); setDone(data.message); }
    catch (err) { setErrors(fieldErrors(err)); setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Forgot password" subtitle="We’ll email you a single-use reset link valid for 30 minutes." footer={<Link to="/login">Back to login</Link>}>
      {done ? <Alert tone="success" title="Check your inbox">{done}</Alert> : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && <Alert tone="danger">{error}</Alert>}
          <Input label="Email address" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} required />
          <Button type="submit" className="w-full" loading={busy}>Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}
