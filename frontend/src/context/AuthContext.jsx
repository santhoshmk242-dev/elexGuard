import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { tokenStore } from '../services/api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) { setUser(null); setLoading(false); return null; }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
      return data.data.user;
    } catch {
      tokenStore.clear(); setUser(null); return null;
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('elexguard:session-expired', onExpired);
    return () => window.removeEventListener('elexguard:session-expired', onExpired);
  }, []);

  const login = useCallback(async (email, password, asAdmin = false) => {
    const { data } = await api.post(asAdmin ? '/auth/admin/login' : '/auth/login', { email, password });
    tokenStore.set(data.data.token);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* token may already be invalid */ }
    tokenStore.clear(); setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout, refresh, setUser }), [user, loading, login, logout, refresh]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
