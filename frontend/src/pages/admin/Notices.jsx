import { useState } from 'react';
import { Trash2, Check } from 'lucide-react';
import api, { errMsg, fieldErrors } from '../../services/api';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Input, PageHeader, Select, Spinner, Textarea, ErrorState } from '../../components/ui';
import { fmtDateTime } from '../../utils/format';

export default function AdminNotices() {
  const toast = useToast();
  const notices = useApi(() => api.get('/admin/notices').then((r) => r.data.data), []);
  const msgs = useApi(() => api.get('/admin/messages', { params: { limit: 20 } }).then((r) => r.data.data), []);
  const [f, setF] = useState({ title: '', body: '', kind: 'info' }); const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(null);

  const publish = async (e) => {
    e.preventDefault(); setBusy(true); setErrors({});
    try { const { data } = await api.post('/admin/notices', f); toast.success(data.message); setF({ title: '', body: '', kind: 'info' }); notices.reload(); }
    catch (err) { setErrors(fieldErrors(err)); toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  const remove = async () => { setBusy(true); try { await api.delete(`/admin/notices/${del.id}`); toast.success('Notice deleted.'); setDel(null); notices.reload(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); } };
  const handle = async (m) => { try { await api.post(`/admin/messages/${m._id}/handled`); msgs.reload(); } catch (e) { toast.error(errMsg(e)); } };

  return (
    <>
      <PageHeader title="Notices & messages" subtitle="Publish public announcements and review contact-form messages." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card><h3 className="mb-3">Publish notice</h3>
            <form onSubmit={publish} className="space-y-3" noValidate>
              <Input label="Title" name="title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} error={errors.title} required />
              <Textarea label="Body" name="body" rows={3} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} error={errors.body} />
              <Select label="Type" name="kind" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>{['info', 'election', 'result', 'maintenance'].map((k) => <option key={k} value={k}>{k}</option>)}</Select>
              <Button type="submit" loading={busy}>Publish</Button>
            </form></Card>
          <h3>Published notices</h3>
          {notices.loading ? <Spinner /> : notices.error ? <ErrorState message={notices.error} onRetry={notices.reload} /> : notices.data.length === 0 ? <EmptyState title="No notices" /> : notices.data.map((n) => (
            <Card key={n.id} className="flex items-start justify-between gap-3"><div><p className="font-medium">{n.title}</p><p className="text-xs text-muted">{fmtDateTime(n.createdAt)} · <Badge tone="info">{n.kind}</Badge></p></div><Button size="sm" variant="secondary" aria-label="Delete notice" onClick={() => setDel(n)}><Trash2 size={14} className="text-danger" /></Button></Card>
          ))}
        </div>
        <div className="space-y-3">
          <h3>Contact messages</h3>
          {msgs.loading ? <Spinner /> : msgs.error ? <ErrorState message={msgs.error} onRetry={msgs.reload} /> : msgs.data.length === 0 ? <EmptyState title="No messages" /> : msgs.data.map((m) => (
            <Card key={m._id}><div className="flex items-start justify-between gap-2"><div><p className="font-medium">{m.subject}</p><p className="text-xs text-muted">{m.name} · {m.email} · {fmtDateTime(m.createdAt)}</p></div>{m.handled ? <Badge tone="success">Handled</Badge> : <Button size="sm" variant="secondary" onClick={() => handle(m)}><Check size={14} />Mark handled</Button>}</div><p className="mt-2 whitespace-pre-line text-sm">{m.message}</p></Card>
          ))}
        </div>
      </div>
      <ConfirmDialog open={Boolean(del)} title="Delete notice" variant="danger" confirmLabel="Delete" loading={busy} onConfirm={remove} onClose={() => setDel(null)} message={`Delete “${del?.title}”?`} />
    </>
  );
}
