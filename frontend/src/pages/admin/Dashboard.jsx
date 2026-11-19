import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Users, UserCheck, Clock, UserX, CalendarDays, Play, CalendarClock, CheckCircle2, Contact, Percent, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import { Async, Badge, Card, EmptyState, PageHeader, StatCard } from '../../components/ui';
import { fmtDateTime, fmtNumber } from '../../utils/format';

export default function AdminDashboard() {
  const state = useApi(() => api.get('/admin/dashboard').then((r) => r.data.data), []);
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Registration, election and participation overview."
        actions={<><Link to="/admin/elections/new" className="btn-primary no-underline">Create election</Link><Link to="/admin/voters?status=pending" className="btn-secondary no-underline">Review pending voters</Link></>} />
      <Async state={state}>{(d) => (
        <div className="space-y-8">
          <section aria-label="Voters">
            <h2 className="mb-3 !text-lg">Voters</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total voters" value={fmtNumber(d.voters.total)} icon={Users} />
              <StatCard label="Verified (approved)" value={fmtNumber(d.voters.verified)} icon={UserCheck} tone="ok" />
              <StatCard label="Pending" value={fmtNumber(d.voters.pending)} icon={Clock} tone="warn" hint={`${d.voters.emailUnverified} with unverified email`} />
              <StatCard label="Rejected" value={fmtNumber(d.voters.rejected)} icon={UserX} tone="danger" />
            </div>
          </section>
          <section aria-label="Elections">
            <h2 className="mb-3 !text-lg">Elections</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total elections" value={d.elections.total} icon={CalendarDays} hint={`${d.elections.draft} draft`} />
              <StatCard label="Active" value={d.elections.active} icon={Play} tone="ok" />
              <StatCard label="Upcoming" value={d.elections.upcoming} icon={CalendarClock} tone="warn" />
              <StatCard label="Completed" value={d.elections.completed} icon={CheckCircle2} tone="navy" />
              <StatCard label="Total candidates" value={d.candidates} icon={Contact} />
              <StatCard label="Votes cast (recent)" value={fmtNumber(d.participation.totalVotes)} icon={UserCheck} tone="ok" />
              <StatCard label="Overall turnout" value={`${d.participation.turnoutPercent}%`} icon={Percent} tone="navy" />
            </div>
          </section>

          <Card>
            <h3 className="mb-4">Voting participation by election</h3>
            {d.participation.byElection.length === 0 ? <EmptyState title="No elections yet" /> : (
              <div className="h-72" role="img" aria-label="Bar chart of eligible voters and votes per election">
                <ResponsiveContainer>
                  <BarChart data={d.participation.byElection.map((e) => ({ name: e.title.length > 18 ? `${e.title.slice(0, 16)}…` : e.title, Eligible: e.totalEligible, Votes: e.totalVotes }))} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip /><Legend />
                    <Bar dataKey="Eligible" fill="#93C5FD" radius={[4, 4, 0, 0]} /><Bar dataKey="Votes" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2"><ShieldAlert size={18} className="text-royal" />Recent security events</h3><Link to="/admin/security" className="text-sm">View all</Link></div>
              {d.recentSecurityEvents.length === 0 ? <p className="py-6 text-center text-sm text-muted">No security events.</p> : (
                <ul className="divide-y divide-line">{d.recentSecurityEvents.map((s) => (
                  <li key={s._id} className="flex items-start justify-between gap-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-medium">{s.type.replace(/_/g, ' ')}</p><p className="truncate text-xs text-muted">{s.details}</p></div><div className="shrink-0 text-right"><Badge tone={s.severity}>{s.severity}</Badge><p className="mt-1 text-xs text-muted">{fmtDateTime(s.createdAt)}</p></div></li>
                ))}</ul>
              )}
            </Card>
            <Card>
              <div className="mb-3 flex items-center justify-between"><h3>Recent activity</h3><Link to="/admin/audit-logs" className="text-sm">Audit logs</Link></div>
              <ul className="divide-y divide-line">{d.recentAudit.map((a) => (
                <li key={a.id} className="py-2.5"><p className="truncate text-sm">{a.description || a.action}</p><p className="text-xs text-muted">{a.actorEmail || 'anonymous'} · {fmtDateTime(a.createdAt)}</p></li>
              ))}</ul>
            </Card>
          </div>
        </div>
      )}</Async>
    </>
  );
}
