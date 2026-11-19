export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
export const fmtNumber = (n) => (typeof n === 'number' ? n.toLocaleString('en-IN') : '—');
export const toInputDateTime = (d) => {
  if (!d) return '';
  const x = new Date(d);
  const p = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
};
export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

export const STATUS_LABEL = {
  draft: 'Draft', scheduled: 'Scheduled', active: 'Active', paused: 'Paused', completed: 'Completed', published: 'Results published',
  pending: 'Pending', approved: 'Approved', rejected: 'Rejected',
};

export function timeLeft(end) {
  const ms = new Date(end).getTime() - Date.now();
  if (ms <= 0) return 'Ended';
  const d = Math.floor(ms / 86400000); const h = Math.floor((ms % 86400000) / 3600000); const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

export const passwordRules = (pw = '') => [
  { ok: pw.length >= 8, text: 'At least 8 characters' },
  { ok: /[a-z]/.test(pw), text: 'A lowercase letter' },
  { ok: /[A-Z]/.test(pw), text: 'An uppercase letter' },
  { ok: /[0-9]/.test(pw), text: 'A number' },
  { ok: /[^A-Za-z0-9]/.test(pw), text: 'A special character' },
];
