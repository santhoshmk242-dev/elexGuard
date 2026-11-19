import { useState } from 'react';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import useDebounce from '../../hooks/useDebounce';
import { Badge, DataTable, ErrorState, PageHeader, Pagination } from '../../components/ui';
import LogFilters from './LogTable';
import { fmtDateTime } from '../../utils/format';

export default function AdminAuditLogs() {
  const [q, setQ] = useState(''); const [action, setAction] = useState(''); const [role, setRole] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [page, setPage] = useState(1); const [sort, setSort] = useState('-createdAt');
  const dq = useDebounce(q);
  const state = useApi(() => api.get('/admin/audit-logs', { params: { q: dq || undefined, action: action || undefined, role: role || undefined, from: from || undefined, to: to || undefined, page, sort, limit: 15 } }).then((r) => r.data), [dq, action, role, from, to, page, sort]);
  return (
    <>
      <PageHeader title="Audit logs" subtitle="Immutable record of administrative and security-relevant actions. Passwords, OTPs and voting choices are never recorded." />
      <LogFilters q={q} setQ={setQ} from={from} setFrom={setFrom} to={to} setTo={setTo} onChange={() => setPage(1)}
        selects={[{ label: 'All actions', value: action, set: setAction, options: state.data?.meta?.actions || [] }, { label: 'All roles', value: role, set: setRole, options: ['admin', 'voter', 'anonymous'] }]} />
      {state.error ? <ErrorState message={state.error} onRetry={state.reload} /> : (
        <>
          <DataTable loading={state.loading} rows={state.data?.data} sort={sort} onSort={setSort} empty="No log entries match your filters." columns={[
            { key: 'createdAt', header: 'Time', sortKey: 'createdAt', render: (l) => <span className="whitespace-nowrap text-xs">{fmtDateTime(l.createdAt)}</span> },
            { key: 'action', header: 'Action', sortKey: 'action', render: (l) => <span className="font-mono text-xs">{l.action}</span> },
            { key: 'description', header: 'Description' },
            { key: 'actorEmail', header: 'Actor', render: (l) => <div className="text-xs"><p>{l.actorEmail || 'anonymous'}</p><Badge tone="info">{l.actorRole}</Badge></div> },
            { key: 'ip', header: 'IP', render: (l) => <span className="font-mono text-xs">{l.ip}</span> },
          ]} />
          <Pagination meta={state.data?.meta} onPage={setPage} />
        </>
      )}
    </>
  );
}
