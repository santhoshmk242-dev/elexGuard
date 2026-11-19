import { Link } from 'react-router-dom';
import { CalendarClock, MapPin, CheckCircle2 } from 'lucide-react';
import { Card, StatusBadge, Badge } from './ui';
import { fmtDateTime, timeLeft } from '../utils/format';

export default function ElectionCard({ election: e, to, footer }) {
  const regions = e.constituencies?.length ? e.constituencies.map((c) => c.name).join(', ') : 'All constituencies';
  return (
    <Card className="flex h-full flex-col">
      <div className="mb-3 flex items-start justify-between gap-2">
        <StatusBadge status={e.status} />
        <span className="text-xs capitalize text-muted">{e.type}</span>
      </div>
      <h3 className="mb-1 !text-lg"><Link to={to} className="!text-navy no-underline hover:!text-royal">{e.title}</Link></h3>
      {e.description && <p className="mb-3 line-clamp-2 text-sm text-muted">{e.description}</p>}
      <ul className="mt-auto space-y-1.5 text-sm text-ink">
        <li className="flex items-start gap-2"><CalendarClock size={15} className="mt-0.5 shrink-0 text-muted" /><span>{fmtDateTime(e.startTime)} → {fmtDateTime(e.endTime)}</span></li>
        <li className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-muted" /><span className="line-clamp-1">{regions}</span></li>
        {e.status === 'active' && <li className="text-xs font-medium text-ok">{timeLeft(e.endTime)}</li>}
        {e.hasVoted && <li className="flex items-center gap-1 text-xs font-medium text-ok"><CheckCircle2 size={14} /> You have voted</li>}
        {e.inMyConstituency === false && <li><Badge tone="warning">Not in your constituency</Badge></li>}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
        <Link to={to} className="text-sm font-medium no-underline">View details →</Link>
        {footer}
      </div>
    </Card>
  );
}
