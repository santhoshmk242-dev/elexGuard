// Inline SVG of the voting DFA M = (Q, Σ, δ, q0, F). Pass `current` to highlight a state.
const STATES = [
  { id: 'S0', label: 'Not Authenticated' }, { id: 'S1', label: 'Authenticated' }, { id: 'S2', label: 'Email Verified' }, { id: 'S3', label: 'Identity Verified' },
  { id: 'S4', label: 'Voter Eligible' }, { id: 'S5', label: 'Ballot Access' }, { id: 'S6', label: 'Vote Submitted' }, { id: 'S7', label: 'Voting Completed' },
];
const EDGES = ['AUTHENTICATE', 'VERIFY_EMAIL', 'VERIFY_IDENTITY', 'CONFIRM_ELIGIBILITY', 'REQUEST_BALLOT', 'SUBMIT_VOTE', 'COMPLETE_VOTING'];

export default function DfaDiagram({ current, compact = false }) {
  const W = 1000; const H = compact ? 190 : 250; const y = compact ? 80 : 110; const gap = 120; const x0 = 70; const r = 30;
  const x = (i) => x0 + i * gap;
  const currentIdx = STATES.findIndex((s) => s.id === current);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Deterministic finite automaton of the ElexGuard voting workflow">
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#64748B" /></marker>
      </defs>
      <line x1="12" y1={y} x2={x(0) - r} y2={y} stroke="#64748B" strokeWidth="1.5" markerEnd="url(#arr)" />
      {EDGES.map((e, i) => (
        <g key={e}>
          <line x1={x(i) + r} y1={y} x2={x(i + 1) - r - 1} y2={y} stroke="#64748B" strokeWidth="1.5" markerEnd="url(#arr)" />
          {!compact && (
            <text x={(x(i) + x(i + 1)) / 2} y={y - 12 - (i % 2) * 14} fontSize="8.5" textAnchor="middle" fill="#142B4F">{e}</text>
          )}
        </g>
      ))}
      <path d={`M ${x(5) - 14} ${y - r + 4} C ${x(5) - 30} ${y - 85}, ${x(5) + 30} ${y - 85}, ${x(5) + 14} ${y - r + 4}`} fill="none" stroke="#64748B" strokeWidth="1.5" markerEnd="url(#arr)" />
      {!compact && <text x={x(5)} y={y - 78} fontSize="8.5" textAnchor="middle" fill="#142B4F">REQUEST_BALLOT</text>}
      {STATES.map((s, i) => {
        const active = i === currentIdx; const accepting = s.id === 'S7';
        return (
          <g key={s.id}>
            <circle cx={x(i)} cy={y} r={r} fill={active ? '#2563EB' : '#DBEAFE'} stroke="#142B4F" strokeWidth="2" />
            {accepting && <circle cx={x(i)} cy={y} r={r - 5} fill="none" stroke="#142B4F" strokeWidth="1.5" />}
            <text x={x(i)} y={y + 5} fontSize="14" fontWeight="700" textAnchor="middle" fill={active ? '#fff' : '#142B4F'}>{s.id}</text>
            <text x={x(i)} y={y + r + 20} fontSize="10" textAnchor="middle" fill="#1F2937">{s.label}</text>
          </g>
        );
      })}
      {!compact && <text x="12" y={H - 10} fontSize="10" fill="#64748B">Any (state, symbol) pair not drawn leads to the rejecting dead state SX. Double circle = accepting state F = {'{S7}'}.</text>}
    </svg>
  );
}
