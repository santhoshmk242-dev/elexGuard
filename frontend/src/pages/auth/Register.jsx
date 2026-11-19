import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Circle } from 'lucide-react';
import AuthShell from './AuthShell';
import { Alert, Button, Input, Select, Textarea } from '../../components/ui';
import api, { errCode, errMsg, fieldErrors } from '../../services/api';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { passwordRules } from '../../utils/format';

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const cons = useApi(() => api.get('/public/constituencies').then((r) => r.data.data), []);
  const [f, setF] = useState({ fullName: '', email: '', phone: '', voterIdNumber: '', dateOfBirth: '', constituency: '', address: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const rules = passwordRules(f.password);

  const submit = async (e) => {
    e.preventDefault(); setError(null);
    const local = {};
    if (f.password !== f.confirm) local.confirm = 'Passwords do not match';
    if (rules.some((r) => !r.ok)) local.password = 'Password does not meet all requirements';
    if (Object.keys(local).length) { setErrors(local); return; }
    setBusy(true); setErrors({});
    try {
      const { confirm, ...body } = f;
      const { data } = await api.post('/auth/register', body);
      toast.success(data.message);
      navigate('/verify-otp', { state: { email: f.email.trim().toLowerCase() } });
    } catch (err) {
      if (err.response?.data?.data?.accountCreated) {
        toast.warning(errMsg(err));
        navigate('/verify-otp', { state: { email: f.email.trim().toLowerCase(), deliveryFailed: true } });
      } else {
        setErrors(fieldErrors(err)); setError(errMsg(err));
        if (errCode(err) === 'EMAIL_EXISTS_UNVERIFIED') toast.info('Use the verification page to request a new code.');
      }
    } finally { setBusy(false); }
  };

  return (
    <AuthShell wide title="Voter registration" subtitle="Create your account. A one-time code will be emailed to verify your address." footer={<>Already registered? <Link to="/login">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert tone="danger">{error}{' '}{error.includes('not verified') && <Link to="/verify-otp" state={{ email: f.email }} className="font-medium underline">Go to verification</Link>}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" name="fullName" value={f.fullName} onChange={set('fullName')} error={errors.fullName} required autoComplete="name" />
          <Input label="Email address" name="email" type="email" value={f.email} onChange={set('email')} error={errors.email} required autoComplete="email" />
          <Input label="Phone (optional)" name="phone" value={f.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" />
          <Input label="Date of birth" name="dateOfBirth" type="date" value={f.dateOfBirth} onChange={set('dateOfBirth')} error={errors.dateOfBirth} required max={new Date().toISOString().slice(0, 10)} />
          <Input label="Voter ID number" name="voterIdNumber" value={f.voterIdNumber} onChange={set('voterIdNumber')} error={errors.voterIdNumber} required help="6–20 letters, digits or hyphens. Checked by an administrator." />
          <Select label="Constituency" name="constituency" value={f.constituency} onChange={set('constituency')} error={errors.constituency} required>
            <option value="">{cons.loading ? 'Loading…' : cons.error ? 'Could not load' : 'Select constituency'}</option>
            {cons.data?.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </Select>
        </div>
        <Textarea label="Address (optional)" name="address" rows={2} value={f.address} onChange={set('address')} error={errors.address} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Password" name="password" type="password" value={f.password} onChange={set('password')} error={errors.password} required autoComplete="new-password" />
          <Input label="Confirm password" name="confirm" type="password" value={f.confirm} onChange={set('confirm')} error={errors.confirm} required autoComplete="new-password" />
        </div>
        <ul className="grid gap-1 text-xs sm:grid-cols-2" aria-label="Password requirements">
          {rules.map((r) => <li key={r.text} className={`flex items-center gap-1.5 ${r.ok ? 'text-ok' : 'text-muted'}`}>{r.ok ? <Check size={13} /> : <Circle size={11} />}{r.text}</li>)}
        </ul>
        <Button type="submit" className="w-full" loading={busy}>Create account &amp; send code</Button>
      </form>
    </AuthShell>
  );
}
