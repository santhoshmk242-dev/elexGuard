import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errMsg, fieldErrors } from '../../services/api';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { Alert, Async, Button, Card, Input, PageHeader, Select, Textarea } from '../../components/ui';
import { toInputDateTime } from '../../utils/format';

export default function AdminElectionForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const cons = useApi(() => api.get('/admin/constituencies').then((r) => r.data.data), []);
  const existing = useApi(() => (editing ? api.get(`/admin/elections/${id}`).then((r) => r.data.data) : Promise.resolve(null)), [id]);
  const [f, setF] = useState({ title: '', description: '', type: 'general', startTime: '', endTime: '', constituencies: [] });
  const [errors, setErrors] = useState({}); const [error, setError] = useState(null); const [busy, setBusy] = useState(false);

  useEffect(() => {
    const e = existing.data;
    if (e) setF({ title: e.title, description: e.description, type: e.type, startTime: toInputDateTime(e.startTime), endTime: toInputDateTime(e.endTime), constituencies: e.constituencies.map((c) => c.id) });
  }, [existing.data]);

  const toggle = (cid) => setF((s) => ({ ...s, constituencies: s.constituencies.includes(cid) ? s.constituencies.filter((x) => x !== cid) : [...s.constituencies, cid] }));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErrors({}); setError(null);
    const body = { ...f, startTime: new Date(f.startTime).toISOString(), endTime: new Date(f.endTime).toISOString() };
    try {
      const res = editing ? await api.put(`/admin/elections/${id}`, body) : await api.post('/admin/elections', body);
      toast.success(res.data.message); navigate(`/admin/elections/${res.data.data.id}`);
    } catch (err) { setErrors(fieldErrors(err)); setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader back={{ to: '/admin/elections', label: 'Elections' }} title={editing ? 'Edit election' : 'Create election'} subtitle="New elections start as drafts. Add at least two candidates before scheduling." />
      <Async state={existing}>{() => (
        <Card className="max-w-3xl">
          <form onSubmit={submit} className="space-y-4" noValidate>
            {error && <Alert tone="danger">{error}</Alert>}
            <Input label="Title" name="title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} error={errors.title} required />
            <Textarea label="Description" name="description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} error={errors.description} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Select label="Type" name="type" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{['general', 'regional', 'local', 'referendum', 'student'].map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}</Select>
              <Input label="Voting opens" name="startTime" type="datetime-local" value={f.startTime} onChange={(e) => setF({ ...f, startTime: e.target.value })} error={errors.startTime} required />
              <Input label="Voting closes" name="endTime" type="datetime-local" value={f.endTime} onChange={(e) => setF({ ...f, endTime: e.target.value })} error={errors.endTime} required />
            </div>
            <fieldset>
              <legend className="label">Constituencies</legend>
              <p className="help mb-2">Leave all unchecked to open the election to every constituency.</p>
              {cons.loading ? <p className="text-sm text-muted">Loading…</p> : cons.data?.length === 0 ? <p className="text-sm text-muted">No constituencies yet – create some first.</p> : (
                <div className="grid gap-2 sm:grid-cols-2">{cons.data?.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm"><input type="checkbox" className="accent-royal" checked={f.constituencies.includes(c.id)} onChange={() => toggle(c.id)} />{c.name} <span className="text-muted">({c.code})</span></label>
                ))}</div>
              )}
            </fieldset>
            <div className="flex gap-3"><Button type="submit" loading={busy}>{editing ? 'Save changes' : 'Create draft'}</Button><Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button></div>
          </form>
        </Card>
      )}</Async>
    </>
  );
}
