import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import api from '../services/api';
import { fmtDateTime } from '../utils/format';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    api.get('/public/notices', { params: { limit: 6 } }).then((r) => setItems(r.data.data)).catch(() => setErr(true));
  }, []);
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Notifications" aria-expanded={open} className="relative rounded-md p-2 text-muted hover:bg-surface hover:text-navy">
        <Bell size={20} />
        {items.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-royal" />}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] rounded-card border border-line bg-white shadow-lg">
          <p className="border-b border-line px-4 py-3 text-sm font-medium text-navy">Public notices</p>
          <ul className="max-h-80 divide-y divide-line overflow-y-auto">
            {err && <li className="px-4 py-3 text-sm text-danger">Could not load notices.</li>}
            {!err && items.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No notices yet.</li>}
            {items.map((n) => (
              <li key={n.id} className="px-4 py-3">
                <p className="text-sm font-medium text-ink">{n.title}</p>
                <p className="text-xs text-muted">{fmtDateTime(n.createdAt)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
