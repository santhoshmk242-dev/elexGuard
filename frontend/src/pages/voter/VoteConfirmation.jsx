import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, Copy, Printer } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import DfaDiagram from '../../components/DfaDiagram';
import { useToast } from '../../context/ToastContext';

export default function VoteConfirmation() {
  const { id } = useParams();
  const { state } = useLocation();
  const toast = useToast();
  if (!state?.receipt) return <Navigate to="/voter/history" replace />;
  return (
    <div className="mx-auto max-w-2xl space-y-6 text-center">
      <Card className="py-10">
        <CheckCircle2 size={64} className="mx-auto text-ok" />
        <h1 className="mt-3 !text-2xl">Your vote has been recorded</h1>
        <p className="mt-1 text-muted">{state.election?.title}</p>
        <div className="mx-auto mt-6 max-w-sm rounded-md border border-dashed border-royal bg-soft/50 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Receipt reference</p>
          <p className="my-1 font-mono text-2xl font-bold tracking-wider text-navy">{state.receipt}</p>
          <p className="text-xs text-muted">Keep this for your records. It does not reveal your choice.</p>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={() => { navigator.clipboard?.writeText(state.receipt); toast.success('Receipt copied.'); }}><Copy size={16} />Copy</Button>
          <Button variant="secondary" onClick={() => window.print()}><Printer size={16} />Print</Button>
          <Link to="/voter" className="btn-primary no-underline">Back to dashboard</Link>
        </div>
        <p className="mt-6 text-sm text-ok">Voting completed – workflow state <span className="font-mono">{state.dfaState}</span>. Further voting attempts will be rejected.</p>
      </Card>
      <Card className="overflow-x-auto text-left"><div className="min-w-[700px]"><DfaDiagram compact current="S7" /></div></Card>
      <p className="text-sm text-muted"><Link to={`/voter/elections/${id}`}>View election details</Link> · <Link to="/voter/history">Voting history</Link></p>
    </div>
  );
}
