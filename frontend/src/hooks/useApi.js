import { useCallback, useEffect, useRef, useState } from 'react';
import { errMsg } from '../services/api';

/** Runs an async loader and exposes { data, loading, error, reload }. Re-runs when deps change. */
export default function useApi(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const alive = useRef(true);
  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await loader();
      if (alive.current) setState({ data: res, loading: false, error: null });
    } catch (e) {
      if (alive.current) setState({ data: null, loading: false, error: errMsg(e) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { alive.current = true; run(); return () => { alive.current = false; }; }, [run]);
  return { ...state, reload: run };
}
