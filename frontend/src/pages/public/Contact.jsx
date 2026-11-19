import { useState } from 'react';
import { Mail, MapPin, ShieldCheck } from 'lucide-react';
import api, { errMsg, fieldErrors } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Button, Card, Input, Textarea } from '../../components/ui';

export default function Contact() {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErrors({});
    try {
      const { data } = await api.post('/public/contact', form);
      toast.success(data.message); setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) { setErrors(fieldErrors(err)); toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="container-x section">
      <h1>Contact the election office</h1>
      <p className="mt-2 text-muted">Questions about registration, schedules or accessibility? Send us a message.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2"><Input label="Your name" name="name" value={form.name} onChange={set('name')} error={errors.name} required /><Input label="Email" name="email" type="email" value={form.email} onChange={set('email')} error={errors.email} required /></div>
            <Input label="Subject" name="subject" value={form.subject} onChange={set('subject')} error={errors.subject} required />
            <Textarea label="Message" name="message" rows={6} value={form.message} onChange={set('message')} error={errors.message} required />
            <Button type="submit" loading={busy}>Send message</Button>
          </form>
        </Card>
        <div className="space-y-4 text-sm">
          <Card className="flex gap-3"><Mail className="text-royal" size={20} /><div><p className="font-medium text-navy">Email</p><p className="text-muted">Messages are reviewed by administrators in the console.</p></div></Card>
          <Card className="flex gap-3"><MapPin className="text-royal" size={20} /><div><p className="font-medium text-navy">Office</p><p className="text-muted">Election Commission (educational prototype) – no physical office.</p></div></Card>
          <Card className="flex gap-3"><ShieldCheck className="text-royal" size={20} /><div><p className="font-medium text-navy">Privacy</p><p className="text-muted">Never include your password, OTP or voting choice in a message.</p></div></Card>
        </div>
      </div>
    </div>
  );
}
