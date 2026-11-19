import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card } from '../../components/ui';

const faqs = [
  ['Who can register?', 'Anyone aged 18 or over with a valid email address and a unique voter ID number. An administrator must approve the registration before you can vote.'],
  ['Why do I need an email code?', 'The one-time code proves you control the email address. It expires after 10 minutes, allows limited attempts and can be used once. Only a hash of the code is stored.'],
  ['Can I vote twice?', 'No. The DFA has no transition out of the “Voting Completed” state, the one-time ballot authorisation is consumed atomically, and a unique database index backs this up.'],
  ['Can administrators see how I voted?', 'No. Ballots contain no voter reference and no timestamp. Eligibility records only say that you voted – never for whom. Audit logs never contain choices.'],
  ['What is my receipt reference?', 'A random code shown after you vote. It proves that your vote was recorded but cannot be used to find or reveal your choice.'],
  ['When are results visible?', 'Only after the election is closed and an administrator publishes the results.'],
  ['Is ElexGuard suitable for real elections?', 'No. It is an educational prototype. Real elections require independent audits, certified hardware and end-to-end verifiable cryptographic protocols.'],
  ['I forgot my password.', 'Use “Forgot password” on the login page. A single-use reset link valid for 30 minutes is emailed to you.'],
];

export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="container-x section max-w-3xl">
      <h1>Frequently asked questions</h1>
      <div className="mt-6 space-y-3">
        {faqs.map(([q, a], i) => (
          <Card key={q} pad={false}>
            <button className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-medium text-navy" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
              {q}<ChevronDown size={18} className={`shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <p className="px-5 pb-4 text-sm text-muted">{a}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
