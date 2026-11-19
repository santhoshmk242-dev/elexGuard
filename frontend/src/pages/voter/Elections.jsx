import { useState } from 'react';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import useDebounce from '../../hooks/useDebounce';
import ElectionCard from '../../components/ElectionCard';
import { Async, EmptyState, PageHeader, Pagination, SearchBox, Tabs } from '../../components/ui';

const tabs = [{ value: '', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'upcoming', label: 'Upcoming' }, { value: 'completed', label: 'Completed' }];

export default function VoterElections() {
  const [group, setGroup] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounce(q);
  const state = useApi(() => api.get('/voter/elections', { params: { group: group || undefined, q: dq || undefined, page, limit: 8 } }).then((r) => r.data), [group, dq, page]);
  return (
    <>
      <PageHeader title="Available elections" subtitle="Elections open to your constituency." />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1"><Tabs tabs={tabs} value={group} onChange={(v) => { setGroup(v); setPage(1); }} /></div>
        <div className="sm:w-64"><SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search elections…" /></div>
      </div>
      <Async state={state}>{(res) => res.data.length === 0 ? <EmptyState title="No elections found" /> : (
        <><div className="grid gap-5 md:grid-cols-2">{res.data.map((e) => <ElectionCard key={e.id} election={e} to={`/voter/elections/${e.id}`} />)}</div><Pagination meta={res.meta} onPage={setPage} /></>
      )}</Async>
    </>
  );
}
