import { Link } from 'react-router-dom';
import { Avatar, Card } from './ui';

export default function CandidateCard({ candidate: c, to, children, selected, onSelect }) {
  const body = (
    <>
      <Avatar name={c.name} src={c.photoUrl} size={64} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-navy">{c.name}</p>
        <p className="truncate text-sm text-muted">{c.party}{c.symbol ? ` · ${c.symbol}` : ''}</p>
        {c.election?.title && <p className="truncate text-xs text-muted">{c.election.title}</p>}
        {to && <Link to={to} className="mt-1 inline-block text-xs font-medium no-underline">View profile →</Link>}
      </div>
      {children}
    </>
  );
  if (onSelect) {
    return (
      <label className={`card flex cursor-pointer items-center gap-4 p-4 transition ${selected ? 'border-royal ring-2 ring-soft' : 'hover:border-royal/50'}`}>
        <input type="radio" name="candidate" className="h-4 w-4 accent-royal" checked={selected} onChange={onSelect} />
        {body}
      </label>
    );
  }
  return <Card className="flex items-center gap-4">{body}</Card>;
}
