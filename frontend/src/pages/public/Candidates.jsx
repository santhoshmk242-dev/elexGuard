import { useState } from 'react';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import useDebounce from '../../hooks/useDebounce';
import CandidateCard from '../../components/CandidateCard';
import { Async, EmptyState, Pagination, SearchBox, Select } from '../../components/ui';

export default function Candidates() {
  const [q, setQ] = useState('');
  const [election, setElection] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounce(q);
  const elections = useApi(() => api.get('/public/elections', { params: { limit: 50 } }).then((r) => r.data.data), []);
  const state = useApi(() => api.get('/public/candidates', { params: { q: dq || undefined, election: election || undefined, page, limit: 12 } }).then((r) => r.data), [dq, election, page]);
  return (
    <div className="container-x section">
      <h1>Candidates</h1>
      <p className="mt-2 text-muted">Public profiles of candidates standing in published elections.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search by name or party…" />
        <Select aria-label="Filter by election" value={election} onChange={(e) => { setElection(e.target.value); setPage(1); }}>
          <option value="">All elections</option>
          {elections.data?.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </Select>
      </div>
      <div className="mt-6">
        <Async state={state}>{(res) => res.data.length === 0 ? <EmptyState title="No candidates found" /> : (
          <><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{res.data.map((c) => <CandidateCard key={c.id} candidate={c} to={`/candidates/${c.id}`} />)}</div><Pagination meta={res.meta} onPage={setPage} /></>
        )}</Async>
      </div>
    </div>
  );
}
