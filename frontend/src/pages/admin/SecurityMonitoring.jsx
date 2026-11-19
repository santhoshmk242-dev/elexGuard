import { useState } from 'react';
import { ShieldAlert, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import useDebounce from '../../hooks/useDebounce';
import { Badge, DataTable, ErrorState, PageHeader, Pagination, StatCard } from '../../components/ui';
import LogFilters from './LogTable';
import { fmtDateTime } from '../../utils/format';

export default function AdminSecurity() {
  const [q, setQ] = useState(''); const [type, setType] = useState(''); const [severity, setSeverity] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [page, setPage] = useState(1); const [sort, setSort] = useState('-createdAt');
  const dq = useDebounce(q);
  const state = useApi(() => api.get('/admin/security-events', { params: { q: dq || undefined, type: type || undefined, severity: severity || undefined, from: from || undefined, to: to || undefined, page, sort, limit: 15 } }).then((r) => r.data), [dq, type, severity, from, to, page, sort]);
  const c = state.data?.meta?.severityCounts || {};
  return (
    <>
      <PageHeader title="Security monitoring" subtitle="Failed logins, invalid DFA transitions, duplicate-vote attempts and unauthorised access." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Critical" value={c.critical || 0} icon={AlertOctagon} tone="danger" /><StatCard label="High" value={c.high || 0} icon={ShieldAlert} tone="danger" />
        <StatCard label="Medium" value={c.medium || 0} icon={AlertTriangle} tone="warn" /><StatCard label="Low" value={c.low || 0} icon={Info} tone="navy" />
      </div>
      <LogFilters q={q} setQ={setQ} from={from} setFrom={setFrom} to={to} setTo={setTo} onChange={() => setPage(1)}
        selects={[{ label: 'All event types', value: type, set: setType, options: state.data?.meta?.types || [] }, { label: 'All severities', value: severity, set: setSeverity, options: ['low', 'medium', 'high', 'critical'] }]} />
      {state.error ? <ErrorState message={state.error} onRetry={state.reload} /> : (
        <>
          <DataTable loading={state.loading} rows={state.data?.data} sort={sort} onSort={setSort} empty="No security events recorded." columns={[
            { key: 'createdAt', header: 'Time', sortKey: 'createdAt', render: (s) => <span className="whitespace-nowrap text-xs">{fmtDateTime(s.createdAt)}</span> },
            { key: 'type', header: 'Event', sortKey: 'type', render: (s) => <span className="text-xs font-medium">{s.type.replace(/_/g, ' ')}</span> },
            { key: 'severity', header: 'Severity', sortKey: 'severity', render: (s) => <Badge tone={s.severity}>{s.severity}</Badge> },
            { key: 'details', header: 'Details' }, { key: 'email', header: 'User', render: (s) => <span className="text-xs">{s.email || '—'}</span> },
            { key: 'ip', header: 'IP / path', render: (s) => <span className="font-mono text-xs">{s.ip}<br />{s.path}</span> },
          ]} />
          <Pagination meta={state.data?.meta} onPage={setPage} />
        </>
      )}
    </>
  );
}
