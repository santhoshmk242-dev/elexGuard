import { SearchBox, Select } from '../../components/ui';
import { Input } from '../../components/ui';

/** Shared filter bar for audit logs / security events: search + select filters + date range. */
export default function LogFilters({ q, setQ, from, setFrom, to, setTo, selects = [], onChange }) {
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <SearchBox value={q} onChange={(v) => { setQ(v); onChange(); }} placeholder="Search…" />
      {selects.map((s) => (
        <Select key={s.label} aria-label={s.label} value={s.value} onChange={(e) => { s.set(e.target.value); onChange(); }}>
          <option value="">{s.label}</option>{s.options.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
        </Select>
      ))}
      <Input aria-label="From date" type="date" name="from" value={from} onChange={(e) => { setFrom(e.target.value); onChange(); }} />
      <Input aria-label="To date" type="date" name="to" value={to} onChange={(e) => { setTo(e.target.value); onChange(); }} />
    </div>
  );
}
