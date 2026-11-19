import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api, { errMsg, fieldErrors } from '../../services/api';
import useApi from '../../hooks/useApi';
import useDebounce from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import { Alert, Button, ConfirmDialog, DataTable, ErrorState, Input, Modal, PageHeader, SearchBox, Textarea } from '../../components/ui';

const blank = { name: '', code: '', region: '', description: '' };

export default function AdminConstituencies() {
  const toast = useToast();
  const [q, setQ] = useState(''); const dq = useDebounce(q);
  const state = useApi(() => api.get('/admin/constituencies', { params: { q: dq || undefined } }).then((r) => r.data.data), [dq]);
  const [form, setForm] = useState(null); const [errors, setErrors] = useState({}); const [error, setError] = useState(null);
  const [del, setDel] = useState(null); const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e?.preventDefault(); setBusy(true); setErrors({}); setError(null);
    const { id, voterCount, ...body } = form;
    try {
      const { data } = id ? await api.put(`/admin/constituencies/${id}`, body) : await api.post('/admin/constituencies', body);
      toast.success(data.message); setForm(null); state.reload();
    } catch (err) { setErrors(fieldErrors(err)); setError(errMsg(err)); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/admin/constituencies/${del.id}`); toast.success('Constituency deleted.'); setDel(null); state.reload(); }
    catch (e) { toast.error(errMsg(e)); setDel(null); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Constituencies" subtitle="Geographic or organisational areas that voters belong to." actions={<Button onClick={() => { setForm({ ...blank }); setErrors({}); setError(null); }}><Plus size={16} />Add constituency</Button>} />
      <div className="mb-4 sm:w-72"><SearchBox value={q} onChange={setQ} placeholder="Search name, code or region…" /></div>
      {state.error ? <ErrorState message={state.error} onRetry={state.reload} /> : (
        <DataTable loading={state.loading} rows={state.data} empty="No constituencies yet." columns={[
          { key: 'name', header: 'Name', render: (c) => <span className="font-medium">{c.name}</span> }, { key: 'code', header: 'Code', render: (c) => <span className="font-mono">{c.code}</span> },
          { key: 'region', header: 'Region' }, { key: 'voterCount', header: 'Registered voters' },
          { key: 'actions', header: 'Actions', render: (c) => <div className="flex gap-1"><Button size="sm" variant="secondary" aria-label={`Edit ${c.name}`} onClick={() => { setForm({ ...c }); setErrors({}); setError(null); }}><Pencil size={14} /></Button><Button size="sm" variant="secondary" aria-label={`Delete ${c.name}`} onClick={() => setDel(c)}><Trash2 size={14} className="text-danger" /></Button></div> },
        ]} />
      )}
      <Modal open={Boolean(form)} onClose={() => setForm(null)} title={form?.id ? 'Edit constituency' : 'Add constituency'} footer={<><Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button><Button onClick={save} loading={busy}>Save</Button></>}>
        {form && <form onSubmit={save} className="space-y-3" noValidate>
          {error && <Alert tone="danger">{error}</Alert>}
          <Input label="Name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} required />
          <Input label="Code" name="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} error={errors.code} required help="Unique, e.g. RSN-01" />
          <Input label="Region" name="region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} error={errors.region} />
          <Textarea label="Description" name="description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} error={errors.description} />
        </form>}
      </Modal>
      <ConfirmDialog open={Boolean(del)} title="Delete constituency" variant="danger" confirmLabel="Delete" loading={busy} onConfirm={remove} onClose={() => setDel(null)} message={`Delete ${del?.name}? This is only possible when no voters or elections use it.`} />
    </>
  );
}
