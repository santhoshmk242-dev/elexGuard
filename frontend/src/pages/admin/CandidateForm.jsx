import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api, { errMsg, fieldErrors } from '../../services/api';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { Alert, Async, Avatar, Button, Card, Input, PageHeader, Select, Textarea } from '../../components/ui';

const MAX = 1024 * 1024;

export default function AdminCandidateForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const elections = useApi(() => api.get('/admin/elections', { params: { limit: 100 } }).then((r) => r.data.data.filter((e) => ['draft', 'scheduled'].includes(e.status))), []);
  const existing = useApi(() => (editing ? api.get(`/admin/candidates/${id}`).then((r) => r.data.data) : Promise.resolve(null)), [id]);
  const [f, setF] = useState({ election: params.get('election') || '', name: '', party: '', symbol: '', manifesto: '', biography: '' });
  const [photo, setPhoto] = useState(null); const [preview, setPreview] = useState(null); const [photoErr, setPhotoErr] = useState(null);
  const [errors, setErrors] = useState({}); const [error, setError] = useState(null); const [busy, setBusy] = useState(false);

  useEffect(() => { const c = existing.data; if (c) setF({ election: c.election, name: c.name, party: c.party, symbol: c.symbol, manifesto: c.manifesto, biography: c.biography }); }, [existing.data]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = (e) => {
    const file = e.target.files?.[0]; setPhotoErr(null);
    if (!file) { setPhoto(null); setPreview(null); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setPhotoErr('Only JPEG, PNG or WebP images are allowed.'); e.target.value = ''; return; }
    if (file.size > MAX) { setPhotoErr('Photograph must be 1 MB or smaller.'); e.target.value = ''; return; }
    setPhoto(file); setPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErrors({}); setError(null);
    const fd = new FormData();
    if (!editing) fd.append('election', f.election);
    ['name', 'party', 'symbol', 'manifesto', 'biography'].forEach((k) => fd.append(k, f[k]));
    if (photo) fd.append('photo', photo);
    try {
      const { data } = editing ? await api.put(`/admin/candidates/${id}`, fd) : await api.post('/admin/candidates', fd);
      toast.success(data.message); navigate(`/admin/elections/${editing ? f.election : f.election}`);
    } catch (err) { setErrors(fieldErrors(err)); setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader back={{ to: '/admin/candidates', label: 'Candidates' }} title={editing ? 'Edit candidate' : 'Add candidate'} />
      <Async state={existing}>{() => (
        <Card className="max-w-3xl">
          <form onSubmit={submit} className="space-y-4" noValidate>
            {error && <Alert tone="danger">{error}</Alert>}
            <Select label="Election" name="election" value={f.election} onChange={(e) => setF({ ...f, election: e.target.value })} error={errors.election} required disabled={editing}>
              <option value="">Select a draft or scheduled election</option>{elections.data?.map((el) => <option key={el.id} value={el.id}>{el.title}</option>)}
            </Select>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Candidate name" name="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={errors.name} required />
              <Input label="Party / affiliation" name="party" value={f.party} onChange={(e) => setF({ ...f, party: e.target.value })} error={errors.party} help="Leave empty for Independent." />
              <Input label="Symbol (optional)" name="symbol" value={f.symbol} onChange={(e) => setF({ ...f, symbol: e.target.value })} error={errors.symbol} />
            </div>
            <Textarea label="Manifesto" name="manifesto" rows={5} value={f.manifesto} onChange={(e) => setF({ ...f, manifesto: e.target.value })} error={errors.manifesto} />
            <Textarea label="Biography" name="biography" rows={3} value={f.biography} onChange={(e) => setF({ ...f, biography: e.target.value })} error={errors.biography} />
            <div className="flex items-center gap-4">
              <Avatar name={f.name || 'Photo'} src={preview ? null : existing.data?.photoUrl} size={72} />
              {preview && <img src={preview} alt="Selected preview" className="h-[72px] w-[72px] rounded-full border border-line object-cover" />}
              <div className="flex-1"><label className="label" htmlFor="photo">Photograph (JPEG, PNG or WebP, max 1 MB)</label><input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-royal-dark" />{photoErr && <p className="err">{photoErr}</p>}</div>
            </div>
            <div className="flex gap-3"><Button type="submit" loading={busy} disabled={!f.election || !f.name}>{editing ? 'Save changes' : 'Add candidate'}</Button><Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button></div>
          </form>
        </Card>
      )}</Async>
    </>
  );
}
