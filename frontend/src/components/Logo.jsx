import { Link } from 'react-router-dom';

export function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="12" fill="#2563EB" />
      <path d="M32 10l18 6v14c0 12-8 20-18 24C22 50 14 42 14 30V16z" fill="#DBEAFE" />
      <path d="M24 31l6 6 11-12" fill="none" stroke="#142B4F" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ to = '/', light = false }) {
  return (
    <Link to={to} className="flex items-center gap-2 no-underline" aria-label="ElexGuard home">
      <LogoMark />
      <span className="leading-tight">
        <span className={`block text-lg font-bold ${light ? 'text-white' : 'text-navy'}`}>ElexGuard</span>
        <span className={`block text-[10px] uppercase tracking-wider ${light ? 'text-blue-200' : 'text-muted'}`}>Secure Elections</span>
      </span>
    </Link>
  );
}
