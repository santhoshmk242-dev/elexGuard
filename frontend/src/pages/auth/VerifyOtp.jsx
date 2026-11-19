import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import { Alert, Button, Input } from '../../components/ui';
import api, { errCode, errMsg } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(location.state?.deliveryFailed ? 'The code could not be emailed. Use “Resend code” once email delivery works.' : null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async (e) => {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      const { data } = await api.post('/auth/verify-otp', { email: email.trim(), otp });
      toast.success(data.message);
      navigate('/login', { replace: true });
    } catch (err) { setError(errMsg(err)); if (errCode(err) === 'ALREADY_VERIFIED') navigate('/login'); } finally { setBusy(false); }
  };

  const resend = async () => {
    if (!email.trim()) { setError('Enter your email address first.'); return; }
    setResending(true); setError(null);
    try {
      const { data } = await api.post('/auth/resend-otp', { email: email.trim() });
      toast.success(data.message); setCooldown(60);
    } catch (err) {
      const wait = err.response?.data?.details?.retryAfterSeconds;
      if (wait) setCooldown(wait);
      setError(errMsg(err));
    } finally { setResending(false); }
  };

  return (
    <AuthShell title="Verify your email" subtitle="Enter the 6-digit code we emailed you. It expires in 10 minutes." footer={<Link to="/login">Back to login</Link>}>
      <form onSubmit={verify} className="space-y-4" noValidate>
        {error && <Alert tone="danger">{error}</Alert>}
        <Input label="Email address" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Verification code" name="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="text-center font-mono text-xl tracking-[0.5em]" required placeholder="••••••" />
        <Button type="submit" className="w-full" loading={busy} disabled={otp.length !== 6 || !email}>Verify email</Button>
        <Button type="button" variant="secondary" className="w-full" onClick={resend} loading={resending} disabled={cooldown > 0}>
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </Button>
      </form>
    </AuthShell>
  );
}
