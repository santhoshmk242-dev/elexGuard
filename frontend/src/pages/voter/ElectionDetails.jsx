import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, CalendarClock, MapPin, Vote, Copy } from 'lucide-react';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { Alert, Async, Card, PageHeader, StatusBadge } from '../../components/ui';
import CandidateCard from '../../components/CandidateCard';
import DfaDiagram from '../../components/DfaDiagram';
import { fmtDateTime } from '../../utils/format';

const STEP_LABEL = {
  AUTHENTICATE: 'Authenticated (active account)', VERIFY_EMAIL: 'Email verified', VERIFY_IDENTITY: 'Identity verified & approved by administrator',
  CONFIRM_ELIGIBILITY: 'Eligible for this election and voting is open', REQUEST_BALLOT: 'Has not already voted',
};

export default function VoterElectionDetails() {
  const { id } = useParams();
  const toast = useToast();
  const state = useApi(() => api.get(`/voter/elections/${id}`).then((r) => r.data.data), [id]);
  return (
    <Async state={state}>{(e) => {
      const el = e.eligibility;
      return (
        <>
          <PageHeader back={{ to: '/voter/elections', label: 'Available elections' }} title={e.title}
            subtitle={<span className="flex items-center gap-2"><StatusBadge status={e.status} /><span className="capitalize">{e.type} election</span></span>}
            actions={
              e.status === 'published' ? <Link to={`/voter/results/${e.id}`} className="btn-primary no-underline">View results</Link> :
              el.eligible && !e.hasVoted ? <Link to={`/voter/elections/${e.id}/ballot`} className="btn-primary btn-lg no-underline"><Vote size={18} />Proceed to ballot</Link> : null} />

          {e.hasVoted && (
            <div className="mb-6"><Alert tone="success" title="You have voted in this election">
              Your receipt reference is <button className="inline-flex items-center gap-1 font-mono font-medium text-navy" onClick={() => { navigator.clipboard?.writeText(e.receiptReference); toast.success('Receipt reference copied.'); }}>{e.receiptReference}<Copy size={13} /></button>. It does not reveal your choice.
            </Alert></div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card><h3 className="mb-2">About this election</h3><p className="whitespace-pre-line text-sm">{e.description || 'No description provided.'}</p></Card>
              <div><h3 className="mb-3">Candidates ({e.candidates.length})</h3><div className="grid gap-4 md:grid-cols-2">{e.candidates.map((c) => <CandidateCard key={c.id} candidate={c} to={`/voter/candidates/${c.id}`} />)}</div></div>
            </div>
            <div className="space-y-4">
              <Card className="space-y-3 text-sm">
                <h3>Schedule &amp; area</h3>
                <p className="flex gap-2"><CalendarClock size={16} className="mt-0.5 text-muted" /><span>{fmtDateTime(e.startTime)}<br />→ {fmtDateTime(e.endTime)}</span></p>
                <p className="flex gap-2"><MapPin size={16} className="mt-0.5 text-muted" /><span>{e.constituencies.length ? e.constituencies.map((c) => c.name).join(', ') : 'All constituencies'}</span></p>
              </Card>
              <Card>
                <h3 className="mb-3">Eligibility check</h3>
                <ul className="space-y-2 text-sm">
                  {el.steps.map((s) => (
                    <li key={s.step} className="flex items-start gap-2">{s.passed ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-danger" />}<span className={s.passed ? 'text-ink' : 'text-muted'}>{STEP_LABEL[s.step]}</span></li>
                  ))}
                </ul>
                {el.reasons.length > 0 && !e.hasVoted && <p className="mt-3 rounded-md bg-warn-bg p-2 text-xs text-warn">{el.reasons[0]}</p>}
                <p className="mt-3 text-xs text-muted">Workflow state: <span className="font-mono">{el.dfaState}</span> – {el.dfaStateLabel}</p>
              </Card>
            </div>
          </div>
          <Card className="mt-6 overflow-x-auto"><h3 className="mb-2">Your position in the voting DFA</h3><div className="min-w-[700px]"><DfaDiagram compact current={el.dfaState} /></div></Card>
        </>
      );
    }}</Async>
  );
}
