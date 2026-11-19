import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, ShieldCheck, Mail } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { cx } from '../components/ui';

const links = [
  { to: '/', label: 'Home', end: true }, { to: '/about', label: 'About' }, { to: '/how-it-works', label: 'How it works' },
  { to: '/elections', label: 'Elections' }, { to: '/candidates', label: 'Candidates' }, { to: '/results', label: 'Results' },
  { to: '/faq', label: 'FAQ' }, { to: '/contact', label: 'Contact' },
];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();
  const dash = user ? (user.role === 'admin' ? '/admin' : '/voter') : null;
  const linkCls = ({ isActive }) => cx('rounded-md px-3 py-2 text-sm font-medium no-underline transition-colors', isActive ? 'bg-soft text-royal' : 'text-ink hover:bg-surface');

  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-navy text-xs text-blue-100">
        <div className="container-x flex items-center justify-between py-1.5">
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Educational prototype – not certified for real elections</span>
          <span className="hidden sm:block">Secure Elections. Trusted Democracy.</span>
        </div>
      </div>
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={linkCls}>{l.label}</NavLink>)}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {dash ? <Link to={dash} className="btn-primary no-underline">Go to dashboard</Link> : (
              <><Link to="/login" className="btn-secondary no-underline">Log in</Link><Link to="/register" className="btn-primary no-underline">Register to vote</Link></>
            )}
          </div>
          <button className="rounded-md p-2 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>{open ? <X /> : <Menu />}</button>
        </div>
        {open && (
          <div className="border-t border-line bg-white lg:hidden" key={pathname}>
            <nav className="container-x flex flex-col gap-1 py-3" aria-label="Mobile">
              {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)} className={linkCls}>{l.label}</NavLink>)}
              <div className="mt-2 flex gap-2">
                {dash ? <Link to={dash} onClick={() => setOpen(false)} className="btn-primary flex-1 no-underline">Dashboard</Link> : (
                  <><Link to="/login" onClick={() => setOpen(false)} className="btn-secondary flex-1 no-underline">Log in</Link><Link to="/register" onClick={() => setOpen(false)} className="btn-primary flex-1 no-underline">Register</Link></>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="bg-navy text-blue-100">
        <div className="container-x grid gap-8 py-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo light />
            <p className="mt-3 max-w-md text-sm text-blue-200">ElexGuard is an academic project demonstrating full-stack web development, formal languages &amp; automata (DFA), and computer-networks concepts through a secure online voting workflow.</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-medium !text-white">Portal</h4>
            <ul className="space-y-2 text-sm">
              {links.slice(1, 6).map((l) => <li key={l.to}><Link className="!text-blue-200 hover:!text-white" to={l.to}>{l.label}</Link></li>)}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-medium !text-white">Access</h4>
            <ul className="space-y-2 text-sm">
              <li><Link className="!text-blue-200 hover:!text-white" to="/login">Voter login</Link></li>
              <li><Link className="!text-blue-200 hover:!text-white" to="/register">Voter registration</Link></li>
              <li><Link className="!text-blue-200 hover:!text-white" to="/admin/login">Administrator login</Link></li>
              <li><Link className="!text-blue-200 hover:!text-white inline-flex items-center gap-1" to="/contact"><Mail size={14} /> Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-blue-300">© {new Date().getFullYear()} ElexGuard – educational prototype. Not certified for use in real government elections.</div>
      </footer>
    </div>
  );
}
