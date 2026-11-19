import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarCheck, Play, Pause, RotateCcw, Square, Megaphone, Trash2, Clock, Plus, Pencil, FileBarChart2 } from 'lucide-react';
import api, { errMsg } from '../../services/api';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { Alert, Async, Button, Card, ConfirmDialog, Input, Modal, PageHeader, StatCard, StatusBadge } from '../../components/ui';
import CandidateCard from '../../components/CandidateCard';
import { fmtDateTime, fmtNumber, toInputDateTime } from '../../utils/format';

const ACTIONS = {
  schedule: { label: 'Schedule election', icon: CalendarCheck, variant: 'primary', text: 'Schedule this election? Candidates will be locked in.' },
  start: { label: 'Start now', icon: Play, variant: 'success', text: 'Start the election now? Voting opens immediately for eligible voters.' },
  pause: { label: 'Pause', icon: Pause, variant: 'secondary', text: 'Pause voting? No votes can be cast until you resume.' },
  resume: { label: 'Resume', icon: RotateCcw, variant: 'success', text: 'Resume voting?' },
  end: { label: 'End election', icon: Square, variant: 'danger', text: 'End the election now? Voting closes permanently and no more votes are accepted.' },
  publish: { label: 'Publish results', icon: Megaphone, variant: 'primary', text: 'Publish the results? They become visible to the public and cannot be unpublished.' },
};
const BY_STATUS = { draft: ['schedule'], scheduled: ['start'], active: ['pause', 'end'], paused: ['resume', 'end'], completed: ['publish'], published: [] };

export default function AdminElectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const state = useApi(() => api.get(`/admin/elections/${id}`).then((r) => r.data.data), [id]);
  const [action, setAction] = useState(null); const [busy, setBusy] = useState(false);
  const [durOpen, setDurOpen] = useState(false); const [endTime, setEndTime] = useState(''); const [durErr, setDurErr] = useState(null);
  const [delOpen, setDelOpen] = useState(false);

  const run = async () => {
    setBusy(true);
    try { const { data } = await api.post(`/admin/elections/${id}/${action}`); toast.success(data.message); setAction(null); state.reload(); }
    catch (e) { toast.error(errMsg(e)); setAction(null); } finally { setBusy(false); }
  };
  const saveDuration = async (e) => {
    e.preventDefault(); setBusy(true); setDurErr(null);
    try { const { data } = await api.patch(`/admin/elections/${id}/duration`, { endTime: new Date(endTime).toISOString() }); toast.success(data.message); setDurOpen(false); state.reload(); }
    catch (err) { setDurErr(errMsg(err)); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/admin/elections/${id}`); toast.success('Draft election deleted.'); navigate('/admin/elections', { replace: true }); }
    catch (e) { toast.error(errMsg(e)); setDelOpen(false); } finally { setBusy(false); }
  };

  return (
    <Async state={state}>{(e) => {
      const editable = ['draft', 'scheduled'].includes(e.status);
      return (
        <>
          <PageHeader back={{ to: '/admin/elections', label: 'Elections' }} title={e.title} subtitle={<span className="flex items-center gap-2"><StatusBadge status={e.status} /><span className="capitalize">{e.type}</span></span>}
            actions={<>
              {BY_STATUS[e.status].map((a) => { const A = ACTIONS[a]; return <Button key={a} variant={A.variant} onClick={() => setAction(a)}><A.icon size={16} />{A.label}</Button>; })}
              {['scheduled', 'active', 'paused'].includes(e.status) && <Button variant="secondary" onClick={() => { setEndTime(toInputDateTime(e.endTime)); setDurErr(null); setDurOpen(true); }}><Clock size={16} />Manage duration</Button>}
              {editable && <Link to={`/admin/elections/${id}/edit`} className="btn-secondary no-underline"><Pencil size={16} />Edit</Link>}
              {e.status === 'draft' && <Button variant="secondary" onClick={() => setDelOpen(true)}><Trash2 size={16} className="text-danger" />Delete</Button>}
            </>} />

          {e.status === 'draft' && e.candidates.length < 2 && <div className="mb-4"><Alert tone="warning" title="Not ready to schedule">Add at least two candidates before scheduling this election.</Alert></div>}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Eligible voters" value={fmtNumber(e.participation.totalEligible)} />
            <StatCard label="Votes cast" value={fmtNumber(e.participation.totalVotes)} tone="ok" />
            <StatCard label="Turnout" value={`${e.participation.turnoutPercent}%`} tone="navy" />
            <StatCard label="Candidates" value={e.candidates.length} tone="warn" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card><h3 className="mb-2">Description</h3><p className="whitespace-pre-line text-sm">{e.description || '—'}</p></Card>
              <div>
                <div className="mb-3 flex items-center justify-between"><h3>Candidates</h3>{editable && <Link to={`/admin/candidates/new?election=${id}`} className="btn-primary btn-sm no-underline"><Plus size={14} />Add candidate</Link>}</div>
                {e.candidates.length === 0 ? <Card><p className="py-4 text-center text-sm text-muted">No candidates yet.</p></Card> : (
                  <div className="grid gap-3 md:grid-cols-2">{e.candidates.map((c) => <CandidateCard key={c.id} candidate={c}>{editable && <Link to={`/admin/candidates/${c.id}/edit`} className="btn-secondary btn-sm no-underline" aria-label={`Edit ${c.name}`}><Pencil size={14} /></Link>}</CandidateCard>)}</div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <Card className="space-y-2 text-sm"><h3>Schedule</h3>
                <p><span className="text-muted">Opens:</span> {fmtDateTime(e.startTime)}</p><p><span className="text-muted">Closes:</span> {fmtDateTime(e.endTime)}</p>
                {e.startedAt && <p><span className="text-muted">Started:</span> {fmtDateTime(e.startedAt)}</p>}{e.endedAt && <p><span className="text-muted">Ended:</span> {fmtDateTime(e.endedAt)}</p>}
                <p><span className="text-muted">Constituencies:</span> {e.constituencies.length ? e.constituencies.map((c) => c.name).join(', ') : 'All'}</p>
              </Card>
              {['completed', 'published'].includes(e.status) && <Card className="space-y-2"><h3>Results &amp; reports</h3><Link to={`/admin/results?election=${id}`} className="btn-secondary w-full no-underline"><FileBarChart2 size={16} />View results</Link><Link to="/admin/reports" className="btn-secondary w-full no-underline">Export reports</Link></Card>}
            </div>
          </div>

          <ConfirmDialog open={Boolean(action)} title={action ? ACTIONS[action].label : ''} message={action ? ACTIONS[action].text : ''} variant={action && ACTIONS[action].variant === 'secondary' ? 'primary' : (action && ACTIONS[action].variant) || 'primary'} loading={busy} onConfirm={run} onClose={() => !busy && setAction(null)} confirmLabel="Confirm" />
          <ConfirmDialog open={delOpen} title="Delete draft election" variant="danger" confirmLabel="Delete" loading={busy} onConfirm={remove} onClose={() => setDelOpen(false)} message="Permanently delete this draft and its candidates?" />
          <Modal open={durOpen} onClose={() => setDurOpen(false)} title="Manage election duration" size="sm"
            footer={<><Button variant="secondary" onClick={() => setDurOpen(false)}>Cancel</Button><Button onClick={saveDuration} loading={busy}>Save</Button></>}>
            <form onSubmit={saveDuration} className="space-y-3">
              {durErr && <Alert tone="danger">{durErr}</Alert>}
              <Input label="New closing time" type="datetime-local" name="endTime" value={endTime} onChange={(ev) => setEndTime(ev.target.value)} required help="Extend or shorten the voting period. Must be in the future." />
            </form>
          </Modal>
        </>
      );
    }}</Async>
  );
}
