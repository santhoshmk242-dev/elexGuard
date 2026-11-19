import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import api, { errCode, errMsg } from '../../services/api';
import { Alert, Avatar, Button, Card, ConfirmDialog, PageHeader } from '../../components/ui';
import { useToast } from '../../context/ToastContext';

export default function VoteReview() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [agree, setAgree] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  // Direct navigation / refresh loses the in-memory ballot session: start again via the ballot page.
  if (!state?.candidate || !state?.ballotToken) return <Navigate to={`/voter/elections/${id}/ballot`} replace />;
  const { candidate: c, election, ballotToken } = state;

  const submit = async () => {
    setBusy(true); setError(null); setErrorCode(null);
    try {
      const { data } = await api.post(`/voter/elections/${id}/vote`, { candidateId: c.id, ballotToken });
      toast.success('Your vote has been recorded.');
      navigate(`/voter/elections/${id}/confirmation`, { replace: true, state: { receipt: data.data.receiptReference, election: data.data.election, dfaState: data.data.dfaState } });
    } catch (err) {
      setOpen(false); setError(errMsg(err)); setErrorCode(errCode(err));
      if (errCode(err) === 'ALREADY_VOTED') setTimeout(() => navigate(`/voter/elections/${id}`, { replace: true }), 2500);
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader back={{ to: `/voter/elections/${id}/ballot`, label: 'Change selection' }} title="Review your vote" subtitle={election.title} />
      {error && <div className="mb-4"><Alert tone="danger">{error} {errorCode !== 'ALREADY_VOTED' && <button className="font-medium underline" onClick={() => navigate(`/voter/elections/${id}/ballot`, { replace: true })}>Return to ballot</button>}</Alert></div>}
      <Card className="space-y-5">
        <p className="text-sm text-muted">You are about to vote for:</p>
        <div className="flex items-center gap-4 rounded-md border border-royal bg-soft/50 p-4"><Avatar name={c.name} src={c.photoUrl} size={72} /><div><p className="text-xl font-bold text-navy">{c.name}</p><p className="text-sm text-muted">{c.party}{c.symbol ? ` · ${c.symbol}` : ''}</p></div></div>
        <div className="flex gap-2 rounded-md bg-warn-bg p-3 text-sm text-warn"><AlertTriangle size={18} className="mt-0.5 shrink-0" /><p><strong>This action is final.</strong> A submitted vote cannot be changed, withdrawn or repeated.</p></div>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-4 w-4 accent-royal" checked={agree} onChange={(e) => setAgree(e.target.checked)} />I confirm that this is my own free choice and I understand that I cannot change it after submission.</label>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" disabled={!agree} onClick={() => setOpen(true)}>Submit my vote</Button>
          <Button size="lg" variant="secondary" onClick={() => navigate(`/voter/elections/${id}/ballot`)}>Go back</Button>
        </div>
      </Card>
      <ConfirmDialog open={open} onClose={() => !busy && setOpen(false)} loading={busy} onConfirm={submit} title="Cast your vote?" confirmLabel="Yes, cast my vote"
        message={`Submit your final vote for ${c.name}? This cannot be undone.`} />
    </div>
  );
}
