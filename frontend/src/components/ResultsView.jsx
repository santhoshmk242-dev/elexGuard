import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Trophy, Users, Vote, Percent } from 'lucide-react';
import { Card, StatCard, DataTable, Avatar } from './ui';
import { fmtNumber } from '../utils/format';

const COLORS = ['#2563EB', '#142B4F', '#60A5FA', '#0891B2', '#64748B', '#93C5FD', '#1E3A66', '#7C9DD6'];

export default function ResultsView({ data }) {
  const chart = data.candidates.map((c) => ({ name: c.name.length > 22 ? `${c.name.slice(0, 20)}…` : c.name, fullName: c.name, votes: c.votes }));
  const empty = data.totalVotes === 0;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Eligible voters" value={fmtNumber(data.totalEligible)} icon={Users} />
        <StatCard label="Votes cast" value={fmtNumber(data.totalVotes)} icon={Vote} tone="ok" />
        <StatCard label="Turnout" value={`${data.turnoutPercent}%`} icon={Percent} tone="navy" />
        <StatCard label={data.winner?.tie ? 'Result' : 'Leading'} value={data.winner ? (data.winner.tie ? 'Tie' : data.winner.name) : '—'} icon={Trophy} tone="warn" hint={data.winner && !data.winner.tie ? data.winner.party : undefined} />
      </div>

      {empty ? <Card><p className="py-8 text-center text-muted">No votes were cast in this election.</p></Card> : (
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <h3 className="mb-4">Votes by candidate</h3>
            <div className="h-72" role="img" aria-label="Bar chart of votes per candidate">
              <ResponsiveContainer>
                <BarChart data={chart} margin={{ left: -10, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip formatter={(v) => [v, 'Votes']} labelFormatter={(_, p) => p?.[0]?.payload?.fullName} />
                  <Bar dataKey="votes" radius={[4, 4, 0, 0]}>{chart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <h3 className="mb-4">Vote share</h3>
            <div className="h-72" role="img" aria-label="Pie chart of vote share">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={chart.filter((c) => c.votes > 0)} dataKey="votes" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {chart.filter((c) => c.votes > 0).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      <div>
        <h3 className="mb-3">Candidate-wise results</h3>
        <DataTable rowKey={(r) => r.id || r.candidate || r.name} rows={data.candidates} columns={[
          { key: 'rank', header: '#', render: (r) => data.candidates.indexOf(r) + 1 },
          { key: 'name', header: 'Candidate', render: (r) => <span className="flex items-center gap-3"><Avatar name={r.name} src={r.photoUrl} size={32} /><span className="font-medium">{r.name}</span></span> },
          { key: 'party', header: 'Party' },
          { key: 'votes', header: 'Votes', render: (r) => fmtNumber(r.votes) },
          { key: 'percent', header: 'Share', render: (r) => (
            <div className="flex min-w-[130px] items-center gap-2"><div className="h-2 flex-1 rounded-full bg-surface"><div className="h-2 rounded-full bg-royal" style={{ width: `${r.percent}%` }} /></div><span className="w-12 text-right text-xs">{r.percent}%</span></div>
          ) },
        ]} />
      </div>

      {data.constituencies?.length > 0 && (
        <div>
          <h3 className="mb-3">Constituency-wise statistics</h3>
          <DataTable rowKey={(r) => r.constituency || r.code} rows={data.constituencies} columns={[
            { key: 'name', header: 'Constituency' }, { key: 'code', header: 'Code' },
            { key: 'eligible', header: 'Eligible', render: (r) => fmtNumber(r.eligible) },
            { key: 'votes', header: 'Votes', render: (r) => fmtNumber(r.votes) },
            { key: 'turnoutPercent', header: 'Turnout', render: (r) => `${r.turnoutPercent}%` },
          ]} />
        </div>
      )}
      <p className="text-xs text-muted">Results are aggregated from anonymous ballots. Individual voter choices are never stored with voter identities.</p>
    </div>
  );
}
