import { useEffect, useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import api, { errMsg, fieldErrors } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge, Button, Card, Input, PageHeader, StatusBadge, Textarea } from '../../components/ui';
import { fmtDate, fmtDateTime, passwordRules } from '../../utils/format';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const isVoter = user.role === 'voter';
  const [form, setForm] = useState({ fullName: '', phone: '', address: '', designation: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErr, setPwErr] = useState({});
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    setForm({ fullName: user.fullName, phone: user.phone || '', address: user.voter?.address || '', designation: user.admin?.designation || '' });
  }, [user]);

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErrors({});
    try {
      const body = { fullName: form.fullName, phone: form.phone };
      if (isVoter) body.address = form.address; else body.designation = form.designation;
      const { data } = await api.put('/auth/me', body);
      setUser(data.data.user); toast.success(data.message);
    } catch (err) { setErrors(fieldErrors(err)); toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  const changePw = async (e) => {
    e.preventDefault(); setPwErr({});
    if (pw.newPassword !== pw.confirm) { setPwErr({ confirm: 'Passwords do not match' }); return; }
    setPwBusy(true);
    try {
      const { data } = await api.put('/auth/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success(data.message); await logout();
      window.location.assign(isVoter ? '/login' : '/admin/login');
    } catch (err) { setPwErr(fieldErrors(err)); toast.error(errMsg(err)); } finally { setPwBusy(false); }
  };

  const rules = passwordRules(pw.newPassword);
  return (
    <>
      <PageHeader title={isVoter ? 'My profile' : 'Administrator profile'} subtitle="Manage your personal details and password." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h3 className="mb-4">Personal details</h3>
            <form onSubmit={save} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full name" name="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} error={errors.fullName} required />
                <Input label="Email (cannot be changed)" name="email" value={user.email} disabled readOnly />
                <Input label="Phone" name="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} />
                {!isVoter && <Input label="Designation" name="designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} error={errors.designation} />}
              </div>
              {isVoter && <Textarea label="Address" name="address" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} error={errors.address} />}
              <Button type="submit" loading={busy}>Save changes</Button>
            </form>
          </Card>
          <Card>
            <h3 className="mb-4">Change password</h3>
            <form onSubmit={changePw} className="space-y-4" noValidate>
              <Input label="Current password" name="currentPassword" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} error={pwErr.currentPassword} required />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="New password" name="newPassword" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} error={pwErr.newPassword} required />
                <Input label="Confirm new password" name="confirm" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={pwErr.confirm} required />
              </div>
              <p className="text-xs text-muted">Needs: {rules.filter((r) => !r.ok).map((r) => r.text.toLowerCase()).join(', ') || 'all requirements met ✓'}. Changing your password signs you out everywhere.</p>
              <Button type="submit" variant="secondary" loading={pwBusy} disabled={!pw.currentPassword || rules.some((r) => !r.ok)}>Change password</Button>
            </form>
          </Card>
        </div>
        <Card className="h-fit space-y-3 text-sm">
          <h3 className="flex items-center gap-2"><BadgeCheck size={18} className="text-royal" />Verification</h3>
          <div className="flex justify-between"><span className="text-muted">Email</span><Badge tone={user.emailVerified ? 'success' : 'warning'}>{user.emailVerified ? 'Verified' : 'Unverified'}</Badge></div>
          {isVoter && user.voter && <>
            <div className="flex justify-between"><span className="text-muted">Identity status</span><StatusBadge status={user.voter.verificationStatus} /></div>
            {user.voter.rejectionReason && <p className="rounded-md bg-danger-bg p-2 text-xs text-danger">{user.voter.rejectionReason}</p>}
            <div className="flex justify-between"><span className="text-muted">Voter ID</span><span className="font-mono">{user.voter.voterIdNumber}</span></div>
            <div className="flex justify-between"><span className="text-muted">Constituency</span><span>{user.voter.constituency?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted">Date of birth</span><span>{fmtDate(user.voter.dateOfBirth)}</span></div>
          </>}
          {!isVoter && user.admin && <div className="flex justify-between"><span className="text-muted">Department</span><span>{user.admin.department}</span></div>}
          <div className="flex justify-between"><span className="text-muted">Last login</span><span>{fmtDateTime(user.lastLoginAt)}</span></div>
        </Card>
      </div>
    </>
  );
}
