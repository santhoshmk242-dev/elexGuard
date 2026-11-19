import { BookOpen, Network, Code2, Cpu } from 'lucide-react';
import { Alert, Card } from '../../components/ui';

const subjects = [
  { icon: Code2, title: 'FSWD – Full Stack Web Development', text: 'React + Vite + Tailwind frontend, Express REST API, MongoDB Atlas via Mongoose, JWT authentication, email OTP, automated tests and deployment on Vercel / Render.' },
  { icon: Cpu, title: 'FLAT – Formal Languages & Automata', text: 'The voting process is modelled as a DFA M = (Q, Σ, δ, q₀, F). Valid voting sessions form a regular language; the backend accepts only words that the automaton accepts.' },
  { icon: Network, title: 'CN – Computer Networks', text: 'Client–server architecture over HTTP/HTTPS (TCP/IP), REST request–response cycle, CORS, bearer-token handling, rate limiting and HTTP security headers.' },
  { icon: BookOpen, title: 'DFA – Deterministic Finite Automaton', text: 'A real, tested automaton engine (separate from the controllers) validates every transition: authenticate → verify email → verify identity → confirm eligibility → ballot access → submit → complete.' },
];

export default function About() {
  return (
    <div className="container-x section">
      <h1>About ElexGuard</h1>
      <p className="mt-3 max-w-3xl text-lg text-muted">ElexGuard – Secure Online Voting and Election Management System Using Deterministic Finite Automata – is an academic project that demonstrates how several computer-science subjects combine in one working application.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {subjects.map(({ icon: Icon, title, text }) => (
          <Card key={title} className="flex gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-soft text-royal"><Icon size={22} /></div><div><h3>{title}</h3><p className="mt-1 text-sm text-muted">{text}</p></div></Card>
        ))}
      </div>
      <div className="mt-8"><Alert tone="warning" title="Educational prototype">ElexGuard is not certified for real government elections. Real systems additionally need end-to-end verifiable cryptography (e.g. blind signatures or homomorphic tallying), hardware-backed key management, coercion resistance, formal security audits, legal certification and accessibility compliance.</Alert></div>
    </div>
  );
}
