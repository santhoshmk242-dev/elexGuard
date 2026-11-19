import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Eye, X } from 'lucide-react';
import api, { errMsg } from '../../services/api';
import useApi from '../../hooks/useApi';
import useDebounce from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import { Badge, Button, DataTable, ErrorState, Modal, PageHeader, Pagination, SearchBox, Select, StatusBadge, Textarea, ConfirmDialog } from '../../components/ui';
import { fmtDate } from '../../utils/format';
import { useSearchParams } from 'react-router-dom';

export function useVoterActions(onDone) {
  const toast = useToast();
  const [approve, setApprove] = useState(null); const [reject, setReject] = useState(null);
  const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(null);
  const doApprove = async () => { setBusy(true); try { const { data } = await api.post(`/admin/voters/${approve.id}/approve`); toast.success(data.message); setApprove(null); onDone(); } catch (e) { toast.error(errMsg(e)); setApprove(null); } finally { setBusy(false); } };
  const doReject = async (e) => { e?.preventDefault(); setBusy(true); setErr(null); try { const { data } = await api.post(`/admin/voters/${reject.id}/reject`, { reason }); toast.success(data.message); setReject(null); setReason(''); onDone(); } catch (er) { setErr(errMsg(er)); } finally { setBusy(false); } };
  const dialogs = (
    <>
      <ConfirmDialog open={Boolean(approve)} title="Approve voter" confirmLabel="Approve" variant="success" loading={busy} onConfirm={doApprove} onClose={() => setApprove(null)} message={`Approve ${approve?.fullName} (${approve?.voterIdNumber})? They will be able to vote in eligible elections.`} />
      <Modal open={Boolean(reject)} onClose={() => setReject(null)} title="Reject voter" size="sm" footer={<><Button variant="secondary" onClick={() => setReject(null)}>Cancel</Button><Button variant="danger" onClick={doReject} loading={busy} disabled={reason.trim().length < 3}>Reject</Button></>}>
        <form onSubmit={doReject} className="space-y-2"><p className="text-sm">Reject {reject?.fullName}? The voter will see the reason you provide.</p><Textarea label="Reason" name="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} error={err} required /></form>
      </Modal>
    </>
  );
  return { setApprove, setReject, dialogs };
}

export default function AdminVoters() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(''); const [status, setStatus] = useState(params.get('status') || ''); const [constituency, setConstituency] = useState('');
  const [emailVerified, setEmailVerified] = useState(''); const [page, setPage] = useState(1); const [sort, setSort] = useState('-createdAt');
  const dq = useDebounce(q);
  const cons = useApi(() => api.get('/admin/constituencies').then((r) => r.data.data), []);
  const state = useApi(() => api.get('/admin/voters', { params: { q: dq || undefined, status: status || undefined, constituency: constituency || undefined, emailVerified: emailVerified || undefined, page, sort, limit: 10 } }).then((r) => r.data), [dq, status, constituency, emailVerified, page, sort]);
  const { setApprove, setReject, dialogs } = useVoterActions(state.reload);
  const reset = (fn) => (e) => { fn(e.target.value); setPage(1); };

  return (
    <>
      <PageHeader title="Voter management" subtitle="Review registrations, verify identity details and approve or reject voters." />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Name, email or voter ID…" />
        <Select aria-label="Verification status" value={status} onChange={reset(setStatus)}><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></Select>
        <Select aria-label="Constituency" value={constituency} onChange={reset(setConstituency)}><option value="">All constituencies</option>{cons.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        <Select aria-label="Email verification" value={emailVerified} onChange={reset(setEmailVerified)}><option value="">Email: any</option><option value="true">Email verified</option><option value="false">Email not verified</option></Select>
      </div>
      {state.error ? <ErrorState message={state.error} onRetry={state.reload} /> : (
        <>
          <DataTable loading={state.loading} rows={state.data?.data} sort={sort} onSort={(s) => { setSort(s); setPage(1); }} empty="No voters match your filters." columns={[
            { key: 'fullName', header: 'Voter', render: (v) => <div><Link to={`/admin/voters/${v.id}`} className="font-medium">{v.fullName}</Link><p className="text-xs text-muted">{v.email}</p></div> },
            { key: 'voterIdNumber', header: 'Voter ID', sortKey: 'voterIdNumber', render: (v) => <span className="font-mono text-xs">{v.voterIdNumber}</span> },
            { key: 'constituency', header: 'Constituency', render: (v) => v.constituency?.name },
            { key: 'emailVerified', header: 'Email', render: (v) => <Badge tone={v.emailVerified ? 'success' : 'warning'}>{v.emailVerified ? 'Verified' : 'Unverified'}</Badge> },
            { key: 'verificationStatus', header: 'Status', sortKey: 'verificationStatus', render: (v) => <StatusBadge status={v.verificationStatus} /> },
            { key: 'createdAt', header: 'Registered', sortKey: 'createdAt', render: (v) => fmtDate(v.registeredAt) },
            { key: 'actions', header: 'Actions', render: (v) => (
              <div className="flex gap-1">
                <Link to={`/admin/voters/${v.id}`} className="btn-secondary btn-sm no-underline" aria-label={`View ${v.fullName}`}><Eye size={14} /></Link>
                {v.verificationStatus !== 'approved' && <Button size="sm" variant="success" onClick={() => setApprove(v)} disabled={!v.emailVerified} title={v.emailVerified ? 'Approve' : 'Email not verified'}><Check size={14} />Approve</Button>}
                {v.verificationStatus !== 'rejected' && <Button size="sm" variant="secondary" onClick={() => setReject(v)}><X size={14} className="text-danger" />Reject</Button>}
              </div>
            ) },
          ]} />
          <Pagination meta={state.data?.meta} onPage={setPage} />
        </>
      )}
      {dialogs}
    </>
  );
}
