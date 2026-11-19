import { Link, useParams } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import { Async, Card, EmptyState, PageHeader } from '../../components/ui';
import ResultsView from '../../components/ResultsView';
import { fmtDate, fmtNumber } from '../../utils/format';

export default function Results({ embedded = false, base = '/results' }) {
  const { id } = useParams();
  const list = useApi(() => (id ? Promise.resolve(null) : api.get('/public/results').then((r) => r.data.data)), [id]);
  const one = useApi(() => (id ? api.get(`/public/results/${id}`).then((r) => r.data.data) : Promise.resolve(null)), [id]);
  const wrap = embedded ? '' : 'container-x section';

  if (id) {
    return (
      <div className={wrap}>
        <Async state={one}>{(r) => r && (
          <>
            <PageHeader back={{ to: base, label: 'All results' }} title={r.election.title} subtitle={`Results published ${fmtDate(r.election.resultsPublishedAt)} · Voting ${fmtDate(r.election.startTime)} – ${fmtDate(r.election.endTime)}`} />
            <ResultsView data={r} />
          </>
        )}</Async>
      </div>
    );
  }
  return (
    <div className={wrap}>
      <PageHeader title="Published results" subtitle="Official aggregated results for completed elections. Results appear only after the administrator publishes them." />
      <Async state={list}>{(rows) => rows && (rows.length === 0 ? <EmptyState title="No results published yet" message="Results are hidden until an election closes and an administrator publishes them." /> : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <Card key={r.id} className="flex flex-col">
              <h3><Link to={`${base}/${r.id}`} className="!text-navy no-underline hover:!text-royal">{r.title}</Link></h3>
              <p className="mt-1 text-xs text-muted">Published {fmtDate(r.resultsPublishedAt)}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm"><div><dt className="text-xs text-muted">Votes</dt><dd className="font-medium">{fmtNumber(r.totalVotes)}</dd></div><div><dt className="text-xs text-muted">Turnout</dt><dd className="font-medium">{r.turnoutPercent}%</dd></div></dl>
              {r.winner && <p className="mt-3 flex items-center gap-2 text-sm"><Trophy size={16} className="text-warn" />{r.winner.tie ? 'Tie at the top' : r.winner.name}</p>}
              <Link to={`${base}/${r.id}`} className="mt-auto pt-3 text-sm font-medium no-underline">View full results →</Link>
            </Card>
          ))}
        </div>
      ))}</Async>
    </div>
  );
}
