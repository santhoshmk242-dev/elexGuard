import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import { Async, Avatar, Card, PageHeader, StatusBadge } from '../../components/ui';
import { fmtDateTime } from '../../utils/format';

export default function CandidateDetails({ backTo = '/candidates' }) {
  const { id } = useParams();
  const state = useApi(() => api.get(`${backTo.startsWith('/voter') ? '/voter' : '/public'}/candidates/${id}`).then((r) => r.data.data), [id]);
  const wrap = backTo.startsWith('/voter') ? '' : 'container-x section';
  return (
    <div className={wrap}>
      <Async state={state}>{(c) => (
        <>
          <PageHeader back={{ to: backTo, label: 'Back' }} title={c.name} subtitle={`${c.party}${c.symbol ? ` · Symbol: ${c.symbol}` : ''}`} />
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="flex flex-col items-center gap-3 text-center"><Avatar name={c.name} src={c.photoUrl} size={140} /><p className="font-medium text-navy">{c.party}</p>
              <div className="w-full border-t border-line pt-3 text-left text-sm"><p className="text-xs uppercase text-muted">Election</p><Link to={backTo.startsWith('/voter') ? `/voter/elections/${c.election.id}` : `/elections/${c.election.id}`}>{c.election.title}</Link><div className="mt-1 flex items-center gap-2"><StatusBadge status={c.election.status} /></div>{c.election.startTime && <p className="mt-1 text-xs text-muted">{fmtDateTime(c.election.startTime)}</p>}</div></Card>
            <div className="space-y-4 md:col-span-2">
              <Card><h3 className="mb-2">Manifesto</h3><p className="whitespace-pre-line text-sm">{c.manifesto || 'No manifesto submitted.'}</p></Card>
              {c.biography && <Card><h3 className="mb-2">Biography</h3><p className="whitespace-pre-line text-sm">{c.biography}</p></Card>}
            </div>
          </div>
        </>
      )}</Async>
    </div>
  );
}
