import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Settings2 } from 'lucide-react';
import api, { errMsg } from '../../services/api';
import useApi from '../../hooks/useApi';
import useDebounce from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import { Button, ConfirmDialog, DataTable, ErrorState, PageHeader, Pagination, SearchBox, Select, StatusBadge } from '../../components/ui';
import { fmtDateTime } from '../../utils/format';

export default function AdminElections() {
  const toast = useToast();
  const [q, setQ] = useState(''); const [status, setStatus] = useState(''); const [page, setPage] = useState(1); const [sort, setSort] = useState('-createdAt');
  const [del, setDel] = useState(null); const [busy, setBusy] = useState(false);
  const dq = useDebounce(q);
  const state = useApi(() => api.get('/admin/elections', { params: { q: dq || undefined, status: status || undefined, page, sort, limit: 10 } }).then((r) => r.data), [dq, status, page, sort]);

  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/admin/elections/${del.id}`); toast.success('Draft election deleted.'); setDel(null); state.reload(); }
    catch (e) { toast.error(errMsg(e)); setDel(null); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Election management" subtitle="Create, schedule and run elections."
        actions={<Link to="/admin/elections/new" className="btn-primary no-underline"><Plus size={16} />Create election</Link>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search by title…" />
        <Select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>{['draft', 'scheduled', 'active', 'paused', 'completed', 'published'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </Select>
      </div>
      {state.error ? <ErrorState message={state.error} onRetry={state.reload} /> : (
        <>
          <DataTable loading={state.loading} rows={state.data?.data} sort={sort} onSort={(s) => { setSort(s); setPage(1); }} empty="No elections match your filters." columns={[
            { key: 'title', header: 'Election', sortKey: 'title', render: (e) => <Link to={`/admin/elections/${e.id}`} className="font-medium">{e.title}</Link> },
            { key: 'status', header: 'Status', sortKey: 'status', render: (e) => <StatusBadge status={e.status} /> },
            { key: 'period', header: 'Voting period', sortKey: 'startTime', render: (e) => <span className="whitespace-nowrap text-xs">{fmtDateTime(e.startTime)}<br />{fmtDateTime(e.endTime)}</span> },
            { key: 'candidateCount', header: 'Candidates' },
            { key: 'votesCast', header: 'Votes' },
            { key: 'actions', header: 'Actions', render: (e) => (
              <div className="flex gap-1">
                <Link to={`/admin/elections/${e.id}`} className="btn-secondary btn-sm no-underline" title="Manage"><Settings2 size={14} />Manage</Link>
                {['draft', 'scheduled'].includes(e.status) && <Link to={`/admin/elections/${e.id}/edit`} className="btn-secondary btn-sm no-underline" aria-label={`Edit ${e.title}`}><Pencil size={14} /></Link>}
                {e.status === 'draft' && <Button size="sm" variant="secondary" aria-label={`Delete ${e.title}`} onClick={() => setDel(e)}><Trash2 size={14} className="text-danger" /></Button>}
              </div>
            ) },
          ]} />
          <Pagination meta={state.data?.meta} onPage={setPage} />
        </>
      )}
      <ConfirmDialog open={Boolean(del)} title="Delete draft election" variant="danger" confirmLabel="Delete" loading={busy} onConfirm={remove} onClose={() => setDel(null)}
        message={`Permanently delete “${del?.title}” and its candidates? This cannot be undone.`} />
    </>
  );
}
