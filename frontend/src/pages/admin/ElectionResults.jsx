import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import { Alert, Async, EmptyState, PageHeader, Select, StatCard, StatusBadge } from '../../components/ui';
import ResultsView from '../../components/ResultsView';
import { fmtNumber } from '../../utils/format';

export default function AdminResults() {
  const [params, setParams] = useSearchParams();
  const id = params.get('election') || '';
  const list = useApi(() => api.get('/admin/elections', { params: { limit: 100 } }).then((r) => r.data.data.filter((e) => e.status !== 'draft')), []);
  const res = useApi(() => (id ? api.get(`/admin/elections/${id}/results`).then((r) => r.data.data) : Promise.resolve(null)), [id]);
  return (
    <>
      <PageHeader title="Election results" subtitle="Candidate-wise tallies become visible only after an election is closed." />
      <div className="mb-6 max-w-md">
        <Select aria-label="Election" value={id} onChange={(e) => setParams(e.target.value ? { election: e.target.value } : {})}>
          <option value="">Select an election…</option>{list.data?.map((e) => <option key={e.id} value={e.id}>{e.title} ({e.status})</option>)}
        </Select>
      </div>
      {!id ? <EmptyState title="Choose an election" message="Pick an election above to see turnout and results." /> : (
        <Async state={res}>{(d) => d && (d.tallyVisible ? (
          <div className="space-y-4"><p className="flex items-center gap-2 text-sm">Status: <StatusBadge status={d.election.status} />{d.election.status === 'completed' && <span className="text-muted">– results are not public until published.</span>}</p><ResultsView data={d} /></div>
        ) : (
          <div className="space-y-4">
            <Alert tone="info" title="Tally hidden">{d.message}</Alert>
            <div className="grid gap-4 sm:grid-cols-3"><StatCard label="Eligible voters" value={fmtNumber(d.totalEligible)} /><StatCard label="Votes cast so far" value={fmtNumber(d.totalVotes)} tone="ok" /><StatCard label="Turnout" value={`${d.turnoutPercent}%`} tone="navy" /></div>
          </div>
        ))}</Async>
      )}
    </>
  );
}
