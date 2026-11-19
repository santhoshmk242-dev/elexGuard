import { Link } from 'react-router-dom';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import { Async, DataTable, EmptyState, PageHeader, StatusBadge } from '../../components/ui';
import { fmtDateTime } from '../../utils/format';

export default function VotingHistory() {
  const state = useApi(() => api.get('/voter/history').then((r) => r.data.data), []);
  return (
    <>
      <PageHeader title="Voting history" subtitle="Elections you have voted in. Your choices are never stored against your identity, so only participation is shown." />
      <Async state={state}>{(rows) => rows.length === 0 ? <EmptyState title="You have not voted yet" message="When you vote, a receipt reference will appear here." /> : (
        <DataTable rowKey={(r) => r.electionId} rows={rows} columns={[
          { key: 'title', header: 'Election', render: (r) => <Link to={`/voter/elections/${r.electionId}`}>{r.title}</Link> },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'receiptReference', header: 'Receipt', render: (r) => <span className="font-mono text-xs">{r.receiptReference}</span> },
          { key: 'votedAt', header: 'Voted (hour)', render: (r) => fmtDateTime(r.votedAt) },
          { key: 'results', header: 'Results', render: (r) => r.resultsPublished ? <Link to={`/voter/results/${r.electionId}`}>View results</Link> : <span className="text-muted">Not published</span> },
        ]} />
      )}</Async>
    </>
  );
}
