import { Link } from 'react-router-dom';
import { BadgeCheck, MailCheck, MapPin, Vote, CalendarClock, CheckCircle2, ListChecks } from 'lucide-react';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { Alert, Async, Badge, Card, EmptyState, StatCard, StatusBadge, PageHeader } from '../../components/ui';
import ElectionCard from '../../components/ElectionCard';

export default function VoterDashboard() {
  const { user } = useAuth();
  const state = useApi(() => api.get('/voter/dashboard').then((r) => r.data.data), []);
  return (
    <>
      <PageHeader title={`Welcome, ${user.fullName.split(' ')[0]}`} subtitle="Your registration status and elections you can take part in." />
      <Async state={state}>{(d) => (
        <div className="space-y-6">
          {d.verification.status === 'pending' && <Alert tone="warning" title="Awaiting administrator approval">Your email is verified. You can vote once an administrator approves your identity details.</Alert>}
          {d.verification.status === 'rejected' && <Alert tone="danger" title="Registration rejected">{d.verification.rejectionReason || 'Your registration was rejected.'} Please contact the election office.</Alert>}

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="flex items-center gap-3"><MailCheck className={d.verification.emailVerified ? 'text-ok' : 'text-warn'} /><div><p className="text-xs uppercase text-muted">Email</p><Badge tone={d.verification.emailVerified ? 'success' : 'warning'}>{d.verification.emailVerified ? 'Verified' : 'Not verified'}</Badge></div></Card>
            <Card className="flex items-center gap-3"><BadgeCheck className="text-royal" /><div><p className="text-xs uppercase text-muted">Identity / approval</p><StatusBadge status={d.verification.status} /></div></Card>
            <Card className="flex items-center gap-3"><MapPin className="text-royal" /><div><p className="text-xs uppercase text-muted">Constituency</p><p className="text-sm font-medium text-navy">{d.verification.constituency?.name}</p></div></Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Eligible elections" value={d.counts.eligible} icon={ListChecks} />
            <StatCard label="Active now" value={d.counts.active} icon={Vote} tone="ok" />
            <StatCard label="Upcoming" value={d.counts.upcoming} icon={CalendarClock} tone="warn" />
            <StatCard label="Votes cast" value={d.counts.voted} icon={CheckCircle2} tone="navy" />
          </div>

          <section>
            <h2 className="mb-3">Open for voting</h2>
            {d.activeElections.length === 0 ? <EmptyState title="No active elections" message="You will see elections here when voting opens for your constituency." /> : (
              <div className="grid gap-5 md:grid-cols-2">{d.activeElections.map((e) => <ElectionCard key={e.id} election={e} to={`/voter/elections/${e.id}`} />)}</div>
            )}
          </section>
          {d.upcomingElections.length > 0 && (
            <section><h2 className="mb-3">Upcoming</h2><div className="grid gap-5 md:grid-cols-2">{d.upcomingElections.map((e) => <ElectionCard key={e.id} election={e} to={`/voter/elections/${e.id}`} />)}</div></section>
          )}
          <p className="text-sm text-muted"><Link to="/voter/elections">Browse all elections →</Link></p>
        </div>
      )}</Async>
    </>
  );
}
