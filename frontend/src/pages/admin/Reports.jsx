import { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import api, { downloadFile, errMsg } from '../../services/api';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { Alert, Async, Button, Card, EmptyState, PageHeader, StatusBadge } from '../../components/ui';
import { fmtDateTime, fmtNumber } from '../../utils/format';

export default function AdminReports() {
  const toast = useToast();
  const [busy, setBusy] = useState('');
  const state = useApi(() => api.get('/admin/elections', { params: { limit: 100, sort: '-endTime' } }).then((r) => r.data.data.filter((e) => ['completed', 'published'].includes(e.status))), []);
  const get = async (e, ext) => {
    const key = `${e.id}-${ext}`; setBusy(key);
    try { await downloadFile(`/admin/elections/${e.id}/report.${ext}`, `elexguard-report.${ext}`); toast.success(`${ext.toUpperCase()} report downloaded.`); }
    catch (err) {
      // Blob error bodies are not auto-parsed; show a clear fallback.
      let msg = errMsg(err);
      if (err.response?.data instanceof Blob) { try { msg = JSON.parse(await err.response.data.text()).message || msg; } catch { /* keep msg */ } }
      toast.error(msg);
    } finally { setBusy(''); }
  };
  return (
    <>
      <PageHeader title="Reports" subtitle="Export election reports as PDF or CSV. Reports contain aggregated counts only." />
      <div className="mb-5"><Alert tone="info">Reports are available once an election has been closed. They are generated from anonymous ballots and every export is written to the audit log.</Alert></div>
      <Async state={state}>{(rows) => rows.length === 0 ? <EmptyState title="No completed elections" message="Close an election to generate its report." /> : (
        <div className="grid gap-4 md:grid-cols-2">{rows.map((e) => (
          <Card key={e.id}>
            <div className="mb-2 flex items-start justify-between gap-2"><h3>{e.title}</h3><StatusBadge status={e.status} /></div>
            <p className="text-xs text-muted">Closed {fmtDateTime(e.endedAt || e.endTime)} · {fmtNumber(e.votesCast)} votes</p>
            <div className="mt-4 flex gap-2">
              <Button variant="primary" size="sm" loading={busy === `${e.id}-pdf`} onClick={() => get(e, 'pdf')}><FileText size={14} />PDF</Button>
              <Button variant="secondary" size="sm" loading={busy === `${e.id}-csv`} onClick={() => get(e, 'csv')}><FileSpreadsheet size={14} />CSV</Button>
            </div>
          </Card>
        ))}</div>
      )}</Async>
    </>
  );
}
