import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Workflow, EyeOff, ArrowRight, Megaphone, CalendarClock, Vote, Users, MapPin } from 'lucide-react';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import ElectionCard from '../../components/ElectionCard';
import { Card, Spinner, ErrorState, EmptyState, Badge } from '../../components/ui';
import { fmtDateTime, fmtNumber } from '../../utils/format';

const features = [
  { icon: Workflow, title: 'DFA-enforced workflow', text: 'Every ballot request is validated by a deterministic finite automaton running on the server. No skipped steps, no second votes.' },
  { icon: EyeOff, title: 'Anonymous ballots', text: 'Eligibility records and ballots live in separate collections. A ballot never references the voter who cast it.' },
  { icon: Lock, title: 'Hardened by design', text: 'JWT sessions, bcrypt, hashed email OTPs, rate limiting, Helmet headers, strict CORS and server-side validation.' },
  { icon: ShieldCheck, title: 'Fully auditable', text: 'Administrative actions and security events are logged – without ever recording a voter’s choice.' },
];

export default function Home() {
  const stats = useApi(() => api.get('/public/stats').then((r) => r.data.data), []);
  const active = useApi(() => api.get('/public/elections', { params: { group: 'active', limit: 3, sort: 'endTime' } }).then((r) => r.data.data), []);
  const upcoming = useApi(() => api.get('/public/elections', { params: { group: 'upcoming', limit: 3 } }).then((r) => r.data.data), []);
  const notices = useApi(() => api.get('/public/notices', { params: { limit: 5 } }).then((r) => r.data.data), []);
  const s = stats.data;

  return (
    <>
      <section className="bg-gradient-to-b from-soft/60 to-white">
        <div className="container-x grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
          <div>
            <Badge tone="info">Educational voting prototype</Badge>
            <h1 className="mt-4">Secure Elections.<br /><span className="text-royal">Trusted Democracy.</span></h1>
            <p className="mt-4 max-w-xl text-lg text-muted">ElexGuard is an official-style digital voting portal that shows how a deterministic finite automaton, anonymous ballots and layered web security can work together in a real full-stack application.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary btn-lg no-underline">Register to vote <ArrowRight size={18} /></Link>
              <Link to="/login" className="btn-secondary btn-lg no-underline">Voter login</Link>
              <Link to="/how-it-works" className="btn-ghost btn-lg no-underline">How it works</Link>
            </div>
          </div>
          <Card className="space-y-4">
            <h3 className="flex items-center gap-2"><Megaphone size={18} className="text-royal" />Public notices</h3>
            {notices.loading ? <Spinner className="py-6" /> : notices.error ? <ErrorState message={notices.error} onRetry={notices.reload} /> :
              notices.data.length === 0 ? <p className="text-sm text-muted">No notices at the moment.</p> : (
                <ul className="divide-y divide-line">
                  {notices.data.map((n) => (
                    <li key={n.id} className="py-3 first:pt-0 last:pb-0"><p className="text-sm font-medium text-ink">{n.title}</p><p className="text-xs text-muted">{fmtDateTime(n.createdAt)}</p></li>
                  ))}
                </ul>
              )}
          </Card>
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="container-x grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {[
            { label: 'Elections', value: s?.elections, icon: Vote }, { label: 'Active now', value: s?.active, icon: CalendarClock },
            { label: 'Approved voters', value: s?.registeredVoters, icon: Users }, { label: 'Constituencies', value: s?.constituencies, icon: MapPin },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-soft text-royal"><Icon size={22} /></div>
              <div><p className="text-2xl font-bold text-navy">{stats.loading ? '…' : fmtNumber(value ?? 0)}</p><p className="text-xs uppercase tracking-wide text-muted">{label}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container-x">
          <div className="mb-6 flex items-end justify-between"><h2>Active elections</h2><Link to="/elections" className="text-sm font-medium">All elections →</Link></div>
          {active.loading ? <Spinner /> : active.error ? <ErrorState message={active.error} onRetry={active.reload} /> :
            active.data.length === 0 ? <EmptyState title="No election is open right now" message="Check the upcoming schedule below." /> : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{active.data.map((e) => <ElectionCard key={e.id} election={e} to={`/elections/${e.id}`} />)}</div>
            )}
          <h2 className="mb-6 mt-12">Upcoming elections</h2>
          {upcoming.loading ? <Spinner /> : upcoming.error ? <ErrorState message={upcoming.error} onRetry={upcoming.reload} /> :
            upcoming.data.length === 0 ? <EmptyState title="No upcoming elections scheduled" /> : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{upcoming.data.map((e) => <ElectionCard key={e.id} election={e} to={`/elections/${e.id}`} />)}</div>
            )}
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <div className="mx-auto mb-10 max-w-2xl text-center"><h2>Built on trust, verified by design</h2><p className="mt-2 text-muted">Four principles shape every screen and every API of the platform.</p></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => (
              <Card key={title}><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-soft text-royal"><Icon size={22} /></div><h3 className="mb-1">{title}</h3><p className="text-sm text-muted">{text}</p></Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
