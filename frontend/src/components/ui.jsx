import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle, Inbox, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { STATUS_LABEL, initials } from '../utils/format';
import { assetUrl } from '../services/api';

export const cx = (...a) => a.filter(Boolean).join(' ');

export function Button({ variant = 'primary', size, loading, children, className, as: As = 'button', ...props }) {
  const cls = cx(`btn-${variant}`, size === 'sm' && 'btn-sm', size === 'lg' && 'btn-lg', className);
  return (
    <As className={cls} disabled={props.disabled || loading} {...props}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </As>
  );
}

export const Card = ({ className, children, pad = true, ...p }) => <div className={cx('card', pad && 'card-pad', className)} {...p}>{children}</div>;

const BADGE = {
  draft: 'bg-slate-100 text-slate-700', scheduled: 'bg-soft text-royal-dark', active: 'bg-ok-bg text-ok', paused: 'bg-warn-bg text-warn',
  completed: 'bg-slate-200 text-slate-700', published: 'bg-navy text-white', pending: 'bg-warn-bg text-warn', approved: 'bg-ok-bg text-ok',
  rejected: 'bg-danger-bg text-danger', low: 'bg-slate-100 text-slate-700', medium: 'bg-warn-bg text-warn', high: 'bg-danger-bg text-danger', critical: 'bg-danger text-white',
  info: 'bg-soft text-royal-dark', success: 'bg-ok-bg text-ok', warning: 'bg-warn-bg text-warn', danger: 'bg-danger-bg text-danger',
};
export const Badge = ({ tone = 'info', children }) => <span className={cx('badge', BADGE[tone] || BADGE.info)}>{children}</span>;
export const StatusBadge = ({ status }) => <Badge tone={status}>{STATUS_LABEL[status] || status}</Badge>;

export function Spinner({ label = 'Loading…', className }) {
  return (
    <div className={cx('flex items-center justify-center gap-2 py-12 text-muted', className)} role="status">
      <Loader2 className="animate-spin" size={20} /> <span className="text-sm">{label}</span>
    </div>
  );
}
export const FullPageSpinner = () => <div className="flex min-h-screen items-center justify-center bg-surface"><Spinner /></div>;

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-danger/30 bg-danger-bg px-6 py-10 text-center" role="alert">
      <AlertCircle className="text-danger" size={28} />
      <p className="max-w-md text-sm text-danger">{message || 'Something went wrong.'}</p>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, action, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line bg-surface px-6 py-12 text-center">
      <Icon className="text-muted" size={32} />
      <p className="font-medium text-navy">{title}</p>
      {message && <p className="max-w-md text-sm text-muted">{message}</p>}
      {action}
    </div>
  );
}

/** Shows loading / error / empty states around a useApi result. */
export function Async({ state, children, empty }) {
  if (state.loading && !state.data) return <Spinner />;
  if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />;
  if (empty && empty(state.data)) return null;
  return children(state.data);
}

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {back && <Link to={back.to} className="mb-1 inline-flex items-center gap-1 text-sm text-muted hover:text-royal"><ChevronLeft size={14} />{back.label}</Link>}
        <h1 className="!text-2xl md:!text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, tone = 'royal', hint }) {
  const tones = { royal: 'bg-soft text-royal', ok: 'bg-ok-bg text-ok', warn: 'bg-warn-bg text-warn', danger: 'bg-danger-bg text-danger', navy: 'bg-slate-100 text-navy' };
  return (
    <Card className="flex items-center gap-4">
      {Icon && <div className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-md', tones[tone])}><Icon size={22} /></div>}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="text-2xl font-bold text-navy">{value ?? '—'}</p>
        {hint && <p className="truncate text-xs text-muted">{hint}</p>}
      </div>
    </Card>
  );
}

/* ----------------------------------- Forms ----------------------------------- */
export function Field({ label, error, help, required, children, htmlFor }) {
  return (
    <div>
      {label && <label className="label" htmlFor={htmlFor}>{label}{required && <span className="text-danger"> *</span>}</label>}
      {children}
      {help && !error && <p className="help">{help}</p>}
      {error && <p className="err" role="alert">{error}</p>}
    </div>
  );
}
export function Input({ label, error, help, required, id, className, ...p }) {
  const fid = id || p.name;
  return (
    <Field label={label} error={error} help={help} required={required} htmlFor={fid}>
      <input id={fid} className={cx('input', error && 'input-error', className)} aria-invalid={Boolean(error)} required={required} {...p} />
    </Field>
  );
}
export function Textarea({ label, error, help, required, id, rows = 4, ...p }) {
  const fid = id || p.name;
  return (
    <Field label={label} error={error} help={help} required={required} htmlFor={fid}>
      <textarea id={fid} rows={rows} className={cx('input', error && 'input-error')} aria-invalid={Boolean(error)} {...p} />
    </Field>
  );
}
export function Select({ label, error, help, required, id, children, ...p }) {
  const fid = id || p.name;
  return (
    <Field label={label} error={error} help={help} required={required} htmlFor={fid}>
      <select id={fid} className={cx('input', error && 'input-error')} aria-invalid={Boolean(error)} {...p}>{children}</select>
    </Field>
  );
}
export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input className="input pl-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}

export function Alert({ tone = 'info', title, children }) {
  const t = { info: 'border-royal bg-soft text-navy', warning: 'border-warn bg-warn-bg text-warn', danger: 'border-danger bg-danger-bg text-danger', success: 'border-ok bg-ok-bg text-ok' };
  return (
    <div className={cx('rounded-md border-l-4 p-4 text-sm', t[tone])} role={tone === 'danger' ? 'alert' : 'note'}>
      {title && <p className="mb-1 font-medium">{title}</p>}
      <div className="text-ink/90">{children}</div>
    </div>
  );
}

/* ---------------------------------- Dialogs ---------------------------------- */
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={cx('max-h-[90vh] w-full overflow-y-auto rounded-t-card bg-white shadow-xl sm:rounded-card', w)}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="!text-lg">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line bg-surface px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', variant = 'primary', loading, onConfirm, onClose, children }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<><Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button><Button variant={variant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button></>}>
      {message && <p className="text-sm text-ink">{message}</p>}
      {children}
    </Modal>
  );
}

/* ----------------------------- Table & pagination ----------------------------- */
export function Pagination({ meta, onPage }) {
  if (!meta || meta.pages <= 1) return meta ? <p className="px-1 pt-3 text-xs text-muted">{meta.total} result{meta.total === 1 ? '' : 's'}</p> : null;
  return (
    <div className="flex flex-col items-center justify-between gap-2 pt-4 text-sm sm:flex-row">
      <p className="text-muted">Page {meta.page} of {meta.pages} · {meta.total} results</p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}><ChevronLeft size={14} />Previous</Button>
        <Button variant="secondary" size="sm" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>Next<ChevronRight size={14} /></Button>
      </div>
    </div>
  );
}

/** columns: [{ key, header, render?(row), sortKey? }] */
export function DataTable({ columns, rows, sort, onSort, loading, empty = 'No records found.', rowKey = (r) => r.id || r._id }) {
  const current = sort?.replace(/^-/, '');
  const desc = sort?.startsWith('-');
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-white">
      <table className="min-w-full divide-y divide-line">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="th" aria-sort={c.sortKey && current === c.sortKey ? (desc ? 'descending' : 'ascending') : undefined}>
                {c.sortKey && onSort ? (
                  <button className="inline-flex items-center gap-1 uppercase hover:text-royal" onClick={() => onSort(current === c.sortKey && !desc ? `-${c.sortKey}` : c.sortKey)}>
                    {c.header}{current === c.sortKey && (desc ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                  </button>
                ) : c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {loading && !rows?.length ? (
            <tr><td className="td" colSpan={columns.length}><Spinner className="py-6" /></td></tr>
          ) : !rows?.length ? (
            <tr><td className="td py-10 text-center text-muted" colSpan={columns.length}>{empty}</td></tr>
          ) : rows.map((r) => (
            <tr key={rowKey(r)} className="hover:bg-surface/70">
              {columns.map((c) => <td key={c.key} className="td">{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Avatar({ name, src, size = 56 }) {
  const url = assetUrl(src);
  return url ? (
    <img src={url} alt={name} width={size} height={size} loading="lazy" className="shrink-0 rounded-full border border-line object-cover" style={{ width: size, height: size }} />
  ) : (
    <div aria-label={name} className="flex shrink-0 items-center justify-center rounded-full bg-soft font-bold text-royal-dark" style={{ width: size, height: size, fontSize: size / 2.8 }}>{initials(name)}</div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cx('whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors', value === t.value ? 'border-royal text-royal' : 'border-transparent text-muted hover:text-ink')}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
