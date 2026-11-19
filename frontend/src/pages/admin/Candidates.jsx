import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api, { errMsg } from '../../services/api';
import useApi from '../../hooks/useApi';
import useDebounce from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import { Avatar, Button, ConfirmDialog, DataTable, ErrorState, PageHeader, Pagination, SearchBox, Select, StatusBadge } from '../../components/ui';

export default function AdminCandidates() {
  const toast = useToast();
  const [q, setQ] = useState(''); const [election, setElection] = useState(''); const [page, setPage] = useState(1); const [sort, setSort] = useState('name');
  const [del, setDel] = useState(null); const [busy, setBusy] = useState(false);
  const dq = useDebounce(q);
  const elections = useApi(() => api.get('/admin/elections', { params: { limit: 100 } }).then((r) => r.data.data), []);
  const state = useApi(() => api.get('/admin/candidates', { params: { q: dq || undefined, election: election || undefined, page, sort, limit: 10 } }).then((r) => r.data), [dq, election, page, sort]);

  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/admin/candidates/${del.id}`); toast.success('Candidate removed.'); setDel(null); state.reload(); }
    catch (e) { toast.error(errMsg(e)); setDel(null); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Candidate management" subtitle="Candidates can be changed while an election is a draft or scheduled."
        actions={<Link to={`/admin/candidates/new${election ? `?election=${election}` : ''}`} className="btn-primary no-underline"><Plus size={16} />Add candidate</Link>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search name or party…" />
        <Select aria-label="Filter by election" value={election} onChange={(e) => { setElection(e.target.value); setPage(1); }}><option value="">All elections</option>{elections.data?.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</Select>
      </div>
      {state.error ? <ErrorState message={state.error} onRetry={state.reload} /> : (
        <>
          <DataTable loading={state.loading} rows={state.data?.data} sort={sort} onSort={(s) => { setSort(s); setPage(1); }} empty="No candidates found." columns={[
            { key: 'name', header: 'Candidate', sortKey: 'name', render: (c) => <span className="flex items-center gap-3"><Avatar name={c.name} src={c.photoUrl} size={36} /><span className="font-medium">{c.name}</span></span> },
            { key: 'party', header: 'Party / affiliation', sortKey: 'party' },
            { key: 'election', header: 'Election', render: (c) => c.election ? <span className="flex items-center gap-2"><Link to={`/admin/elections/${c.election.id}`}>{c.election.title}</Link><StatusBadge status={c.election.status} /></span> : '—' },
            { key: 'actions', header: 'Actions', render: (c) => {
              const editable = c.election && ['draft', 'scheduled'].includes(c.election.status);
              return editable ? (
                <div className="flex gap-1"><Link to={`/admin/candidates/${c.id}/edit`} className="btn-secondary btn-sm no-underline" aria-label={`Edit ${c.name}`}><Pencil size={14} />Edit</Link>
                  <Button size="sm" variant="secondary" aria-label={`Remove ${c.name}`} onClick={() => setDel(c)}><Trash2 size={14} className="text-danger" /></Button></div>
              ) : <span className="text-xs text-muted">Locked</span>;
            } },
          ]} />
          <Pagination meta={state.data?.meta} onPage={setPage} />
        </>
      )}
      <ConfirmDialog open={Boolean(del)} title="Remove candidate" variant="danger" confirmLabel="Remove" loading={busy} onConfirm={remove} onClose={() => setDel(null)} message={`Remove ${del?.name} from the election?`} />
    </>
  );
}
