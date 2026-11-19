import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';
export const TOKEN_KEY = 'elexguard_token';

// Token lives in sessionStorage (cleared when the tab closes). It is sent as a Bearer token over HTTPS;
// because it is not a cookie, the API is not exposed to CSRF.
export const tokenStore = {
  get: () => { try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { sessionStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } },
  clear: () => { try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
};

const api = axios.create({ baseURL: BASE, timeout: 20000, headers: { Accept: 'application/json' } });

api.interceptors.request.use((config) => {
  const t = tokenStore.get();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    // Session revoked / expired: tell the app so it can clear state and redirect.
    if (status === 401 && ['INVALID_TOKEN', 'SESSION_REVOKED'].includes(code) && tokenStore.get()) {
      tokenStore.clear();
      window.dispatchEvent(new CustomEvent('elexguard:session-expired'));
    }
    return Promise.reject(error);
  }
);

/** Human readable message for any failed request (network errors, timeouts, API errors). */
export function errMsg(error) {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (error?.message === 'Network Error' || !error?.response) return 'Cannot reach the server. Check your internet connection and try again.';
  return 'Something went wrong. Please try again.';
}
export const errCode = (error) => error?.response?.data?.code;
export const fieldErrors = (error) => error?.response?.data?.details?.fields || {};

/** Candidate photos are served by the API; build an absolute URL when the API is on another origin. */
export function assetUrl(path) {
  if (!path) return null;
  if (/^https?:/i.test(path)) return path;
  if (/^https?:/i.test(BASE)) return new URL(BASE).origin + path;
  return path;
}

/** Download a file (CSV/PDF) through the authenticated API. */
export async function downloadFile(path, fallbackName) {
  const res = await api.get(path, { responseType: 'blob' });
  const cd = res.headers['content-disposition'] || '';
  const match = /filename="?([^";]+)"?/i.exec(cd);
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = match ? match[1] : fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default api;
