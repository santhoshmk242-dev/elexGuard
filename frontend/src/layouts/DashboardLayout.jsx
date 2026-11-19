import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import Logo from '../components/Logo';
import NotificationBell from '../components/NotificationBell';
import { ConfirmDialog, Avatar, cx } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function DashboardLayout({ nav, title, home }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const doLogout = async () => {
    await logout();
    toast.success('You have been logged out securely.');
    navigate(user?.role === 'admin' ? '/admin/login' : '/login', { replace: true });
  };

  const item = ({ isActive }) => cx(
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium no-underline transition-colors',
    isActive ? 'bg-royal text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-navy">
      <div className="flex h-16 items-center justify-between px-4"><Logo to={home} light /><button className="text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button></div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label={title}>
        {nav.map((g) => (
          <div key={g.group || 'main'} className="mb-3">
            {g.group && <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-blue-300">{g.group}</p>}
            {g.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={item}><Icon size={18} />{label}</NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button onClick={() => setConfirm(true)} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white"><LogOut size={18} />Log out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">{sidebar}</aside>
        </div>
      )}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button className="rounded-md p-2 hover:bg-surface lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
          <span className="hidden text-sm font-medium text-navy sm:block">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="flex items-center gap-2">
            <Avatar name={user?.fullName || 'U'} size={34} />
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-medium text-ink">{user?.fullName}</p>
              <p className="text-xs capitalize text-muted">{user?.role}</p>
            </div>
          </div>
        </div>
      </header>
      <main className="p-4 sm:p-6"><div className="mx-auto max-w-6xl"><Outlet /></div></main>
      <ConfirmDialog open={confirm} title="Log out" message="Do you want to end your secure session?" confirmLabel="Log out" onConfirm={doLogout} onClose={() => setConfirm(false)} />
    </div>
  );
}
