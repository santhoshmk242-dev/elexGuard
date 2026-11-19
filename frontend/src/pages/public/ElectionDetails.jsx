import { Link, useParams } from 'react-router-dom';
import { CalendarClock, MapPin, Users } from 'lucide-react';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { Async, Card, PageHeader, StatusBadge, StatCard } from '../../components/ui';
import CandidateCard from '../../components/CandidateCard';
import { fmtDateTime, fmtNumber } from '../../utils/format';

export default function ElectionDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const state = useApi(() => api.get(`/public/elections/${id}`).then((r) => r.data.data), [id]);
  return (
    <div className="container-x section">
      <Async state={state}>{(e) => (
        <>
          <PageHeader back={{ to: '/elections', label: 'All elections' }} title={e.title}
            subtitle={<span className="flex items-center gap-2"><StatusBadge status={e.status} /> <span className="capitalize">{e.type} election</span></span>}
            actions={e.status === 'published' ? <Link to={`/results/${e.id}`} className="btn-primary no-underline">View results</Link> :
              e.status === 'active' ? <Link to={user?.role === 'voter' ? `/voter/elections/${e.id}` : '/login'} className="btn-primary no-underline">{user?.role === 'voter' ? 'Open voter portal' : 'Log in to vote'}</Link> : null} />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card><h3 className="mb-2">About this election</h3><p className="whitespace-pre-line text-sm text-ink">{e.description || 'No description provided.'}</p></Card>
              <div>
                <h3 className="mb-3 flex items-center gap-2"><Users size={18} />Candidates ({e.candidates.length})</h3>
                <div className="grid gap-4 md:grid-cols-2">{e.candidates.map((c) => <CandidateCard key={c.id} candidate={c} to={`/candidates/${c.id}`} />)}</div>
              </div>
            </div>
            <div className="space-y-4">
              <Card className="space-y-3 text-sm">
                <h3>Schedule</h3>
                <p className="flex gap-2"><CalendarClock size={16} className="mt-0.5 text-muted" /><span><strong>Opens:</strong> {fmtDateTime(e.startTime)}<br /><strong>Closes:</strong> {fmtDateTime(e.endTime)}</span></p>
                <p className="flex gap-2"><MapPin size={16} className="mt-0.5 text-muted" /><span><strong>Constituencies:</strong><br />{e.constituencies.length ? e.constituencies.map((c) => c.name).join(', ') : 'All constituencies'}</span></p>
              </Card>
              {e.participation && <><StatCard label="Votes cast so far" value={fmtNumber(e.participation.totalVotes)} /><StatCard label="Turnout" value={`${e.participation.turnoutPercent}%`} tone="navy" hint={`of ${fmtNumber(e.participation.totalEligible)} eligible voters`} /></>}
            </div>
          </div>
        </>
      )}</Async>
    </div>
  );
}
