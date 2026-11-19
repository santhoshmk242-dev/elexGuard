import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Clock, ShieldCheck } from 'lucide-react';
import api, { errCode, errMsg } from '../../services/api';
import { Alert, Button, Card, ErrorState, PageHeader, Spinner } from '../../components/ui';
import CandidateCard from '../../components/CandidateCard';
import DfaDiagram from '../../components/DfaDiagram';

export default function Ballot() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [blocked, setBlocked] = useState(null);
  const [selected, setSelected] = useState(null);
  const [now, setNow] = useState(Date.now());
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return; // React StrictMode double-invoke guard: ask the DFA for access once
    requested.current = true;
    api.post(`/voter/elections/${id}/ballot-access`)
      .then((r) => setSession(r.data.data))
      .catch((e) => { const code = errCode(e); (['NOT_ELIGIBLE', 'ALREADY_VOTED', 'DFA_INVALID_TRANSITION'].includes(code) ? setBlocked : setError)(errMsg(e)); });
  }, [id]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  if (blocked) {
    return (<><PageHeader back={{ to: `/voter/elections/${id}`, label: 'Election details' }} title="Ballot unavailable" /><Alert tone="danger" title="Access to the ballot was refused by the server">{blocked}</Alert></>);
  }
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!session) return <Spinner label="Validating your voting session…" />;

  const remaining = Math.max(Math.floor((new Date(session.expiresAt).getTime() - now) / 1000), 0);
  const expired = remaining === 0;
  const chosen = session.candidates.find((c) => c.id === selected);
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0'); const ss = String(remaining % 60).padStart(2, '0');

  return (
    <>
      <PageHeader back={{ to: `/voter/elections/${id}`, label: 'Election details' }} title={session.election.title} subtitle="Select exactly one candidate, then review your choice before submitting." />
      <div className="mb-5 grid gap-4 md:grid-cols-2">
        <Alert tone="success" title="Ballot access granted"><span className="flex items-center gap-2"><ShieldCheck size={16} />Your session passed every DFA check (state S5).</span></Alert>
        <Alert tone={remaining < 120 ? 'warning' : 'info'} title="Ballot session"><span className="flex items-center gap-2"><Clock size={16} />{expired ? 'Expired – reload to request a new session.' : `Expires in ${mm}:${ss}`}</span></Alert>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); navigate(`/voter/elections/${id}/review`, { state: { candidate: chosen, election: session.election, ballotToken: session.ballotToken, expiresAt: session.expiresAt } }); }}>
        <fieldset><legend className="mb-3 text-lg font-medium text-navy">Candidates</legend>
          <div className="space-y-3">
            {session.candidates.map((c) => (
              <div key={c.id}>
                <CandidateCard candidate={c} selected={selected === c.id} onSelect={() => setSelected(c.id)} />
                {c.manifesto && selected === c.id && <Card className="mt-2 text-sm"><p className="mb-1 font-medium text-navy">Manifesto</p><p className="whitespace-pre-line text-muted">{c.manifesto}</p></Card>}
              </div>
            ))}
          </div>
        </fieldset>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={!selected || expired}>Review my selection</Button>
          <Link to={`/voter/elections/${id}`} className="btn-secondary btn-lg no-underline">Cancel</Link>
          {expired && <Button type="button" variant="ghost" onClick={() => window.location.reload()}>Reload ballot</Button>}
        </div>
      </form>
      <Card className="mt-8 overflow-x-auto"><div className="min-w-[700px]"><DfaDiagram compact current="S5" /></div></Card>
    </>
  );
}
