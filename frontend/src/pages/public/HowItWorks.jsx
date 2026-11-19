import { Link } from 'react-router-dom';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import DfaDiagram from '../../components/DfaDiagram';
import { Card, Spinner, ErrorState, DataTable } from '../../components/ui';

const steps = [
  ['Register & verify email', 'Create an account with your voter details. A one-time code is emailed to you; it expires, is stored only as a hash, and can be used once.'],
  ['Administrator approval', 'An election administrator checks your identity details and approves (or rejects) your registration.'],
  ['Choose an election', 'See the elections for your constituency. Voting is only possible while an election is active and inside its scheduled period.'],
  ['DFA validates your session', 'The server feeds your session to the automaton. Any skipped or repeated step is rejected and logged as a security event.'],
  ['Select & review', 'You receive a one-time ballot authorisation, pick one candidate and confirm on a review screen.'],
  ['Cast & receive a receipt', 'The authorisation is consumed atomically, an anonymous ballot is stored, and you get a receipt reference that does not reveal your choice.'],
];

export default function HowItWorks() {
  const dfa = useApi(() => api.get('/public/dfa').then((r) => r.data.data), []);
  return (
    <div className="container-x section space-y-12">
      <div><h1>How ElexGuard works</h1><p className="mt-3 max-w-3xl text-lg text-muted">From registration to receipt in six guarded steps.</p></div>
      <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {steps.map(([t, d], i) => (
          <li key={t}><Card className="h-full"><span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-royal text-sm font-bold text-white">{i + 1}</span><h3>{t}</h3><p className="mt-1 text-sm text-muted">{d}</p></Card></li>
        ))}
      </ol>

      <section aria-labelledby="dfa-h">
        <h2 id="dfa-h">The voting DFA</h2>
        <p className="mt-2 max-w-3xl text-muted">The workflow is a deterministic finite automaton <strong>M = (Q, Σ, δ, q₀, F)</strong> with Q = {'{S0 … S7, SX}'}, q₀ = S0, F = {'{S7}'}. SX is the rejecting dead state that makes δ a total function. The table below is loaded live from the running server.</p>
        <Card className="mt-4 overflow-x-auto"><div className="min-w-[760px]"><DfaDiagram /></div></Card>
        {dfa.loading ? <Spinner /> : dfa.error ? <ErrorState message={dfa.error} onRetry={dfa.reload} /> : (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2">Transition function δ</h3>
              <DataTable rowKey={(r) => `${r.from}-${r.symbol}`} rows={dfa.data.transitionTable} columns={[
                { key: 'from', header: 'State', render: (r) => <span className="font-mono">{r.from} <span className="text-muted">({dfa.data.labels[r.from]})</span></span> },
                { key: 'symbol', header: 'Input symbol', render: (r) => <span className="font-mono text-xs">{r.symbol}</span> },
                { key: 'to', header: 'Next state', render: (r) => <span className="font-mono">{r.to}</span> },
              ]} />
            </div>
            <div>
              <h3 className="mb-2">Formal definition</h3>
              <Card className="space-y-2 text-sm">
                <p><strong>Q</strong> = {'{'}{dfa.data.Q.join(', ')}{'}'}</p>
                <p><strong>Σ</strong> = {'{'}{dfa.data.Sigma.join(', ')}{'}'}</p>
                <p><strong>q₀</strong> = {dfa.data.q0}</p>
                <p><strong>F</strong> = {'{'}{dfa.data.F.join(', ')}{'}'}</p>
                <p className="text-muted">Any (state, symbol) pair not in the table leads to <span className="font-mono">SX</span> and the request is rejected.</p>
              </Card>
            </div>
          </div>
        )}
      </section>
      <p className="text-sm text-muted">Ready? <Link to="/register">Register</Link> or <Link to="/login">log in</Link>. Questions? See the <Link to="/faq">FAQ</Link>.</p>
    </div>
  );
}
