import { useParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import { Alert, Async, Badge, Button, Card, DataTable, PageHeader, StatusBadge } from '../../components/ui';
import { useVoterActions } from './Voters';
import { fmtDate, fmtDateTime } from '../../utils/format';

const Row = ({ k, v }) => <div className="flex justify-between gap-4 border-b border-line py-2 text-sm last:border-0"><span className="text-muted">{k}</span><span className="text-right font-medium text-ink">{v || '—'}</span></div>;

export default function AdminVoterDetails() {
  const { id } = useParams();
  const state = useApi(() => api.get(`/admin/voters/${id}`).then((r) => r.data.data), [id]);
  const { setApprove, setReject, dialogs } = useVoterActions(state.reload);
  return (
    <Async state={state}>{(v) => (
      <>
        <PageHeader back={{ to: '/admin/voters', label: 'Voters' }} title={v.fullName} subtitle={v.email}
          actions={<>
            {v.verificationStatus !== 'approved' && <Button variant="success" onClick={() => setApprove(v)} disabled={!v.emailVerified}><Check size={16} />Approve</Button>}
            {v.verificationStatus !== 'rejected' && <Button variant="secondary" onClick={() => setReject(v)}><X size={16} className="text-danger" />Reject</Button>}
          </>} />
        {!v.emailVerified && <div className="mb-4"><Alert tone="warning">This voter has not verified their email address, so they cannot be approved yet.</Alert></div>}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card><h3 className="mb-2">Registration details</h3>
            <Row k="Voter ID" v={<span className="font-mono">{v.voterIdNumber}</span>} /><Row k="Date of birth" v={fmtDate(v.dateOfBirth)} /><Row k="Phone" v={v.phone} /><Row k="Address" v={v.address} />
            <Row k="Constituency" v={v.constituency ? `${v.constituency.name} (${v.constituency.code})` : ''} /><Row k="Registered" v={fmtDateTime(v.registeredAt)} /><Row k="Last login" v={fmtDateTime(v.lastLoginAt)} /></Card>
          <Card><h3 className="mb-2">Verification</h3>
            <Row k="Email" v={<Badge tone={v.emailVerified ? 'success' : 'warning'}>{v.emailVerified ? 'Verified' : 'Unverified'}</Badge>} />
            <Row k="Identity status" v={<StatusBadge status={v.verificationStatus} />} /><Row k="Reviewed" v={fmtDateTime(v.reviewedAt)} />
            {v.rejectionReason && <Row k="Rejection reason" v={v.rejectionReason} />}</Card>
        </div>
        <h3 className="mb-3 mt-6">Election participation</h3>
        <p className="mb-2 text-xs text-muted">Shows whether the voter has voted – never who they voted for.</p>
        <DataTable rowKey={(r) => r.electionId} rows={v.participation} empty="This voter has not interacted with any election yet." columns={[
          { key: 'title', header: 'Election' }, { key: 'hasVoted', header: 'Voted', render: (r) => <Badge tone={r.hasVoted ? 'success' : 'info'}>{r.hasVoted ? 'Yes' : 'No'}</Badge> }, { key: 'dfaState', header: 'Workflow state', render: (r) => <span className="font-mono">{r.dfaState}</span> },
        ]} />
        {dialogs}
      </>
    )}</Async>
  );
}
