import { useState } from 'react';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import useDebounce from '../../hooks/useDebounce';
import ElectionCard from '../../components/ElectionCard';
import { Async, EmptyState, Pagination, SearchBox, Tabs } from '../../components/ui';

const tabs = [{ value: '', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'upcoming', label: 'Upcoming' }, { value: 'completed', label: 'Completed' }];

export default function Elections() {
  const [group, setGroup] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounce(q);
  const state = useApi(() => api.get('/public/elections', { params: { group: group || undefined, q: dq || undefined, page, limit: 9 } }).then((r) => r.data), [group, dq, page]);
  return (
    <div className="container-x section">
      <h1>Elections</h1>
      <p className="mt-2 text-muted">Schedules, constituencies and announcements for every published election.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1"><Tabs tabs={tabs} value={group} onChange={(v) => { setGroup(v); setPage(1); }} /></div>
        <div className="sm:w-72"><SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search elections…" /></div>
      </div>
      <div className="mt-6">
        <Async state={state}>{(res) => res.data.length === 0 ? <EmptyState title="No elections found" message="Try a different filter or search term." /> : (
          <>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{res.data.map((e) => <ElectionCard key={e.id} election={e} to={`/elections/${e.id}`} />)}</div>
            <Pagination meta={res.meta} onPage={setPage} />
          </>
        )}</Async>
      </div>
    </div>
  );
}
