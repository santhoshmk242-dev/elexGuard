import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

const ICON = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info };
const STYLE = {
  success: 'border-ok text-ok bg-ok-bg', error: 'border-danger text-danger bg-danger-bg',
  warning: 'border-warn text-warn bg-warn-bg', info: 'border-royal text-royal bg-soft',
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const remove = useCallback((id) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l.slice(-3), { id, type, message }]);
    setTimeout(() => remove(id), type === 'error' ? 7000 : 4500);
  }, [remove]);
  const api = useMemo(() => ({
    success: (m) => push('success', m), error: (m) => push('error', m), warning: (m) => push('warning', m), info: (m) => push('info', m),
  }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" role="status" aria-live="polite">
        {items.map((t) => {
          const Icon = ICON[t.type];
          return (
            <div key={t.id} className={`flex items-start gap-3 rounded-md border-l-4 bg-white p-3 shadow-lg ${STYLE[t.type]}`}>
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1 text-sm text-ink">{t.message}</p>
              <button onClick={() => remove(t.id)} aria-label="Dismiss" className="text-muted hover:text-ink"><X size={16} /></button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
