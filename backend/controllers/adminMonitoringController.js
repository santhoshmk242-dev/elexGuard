'use strict';
const PDFDocument = require('pdfkit');
const { Voter, Election, Candidate, AuditLog, SecurityEvent, User, AnonymousBallot } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { parsePaging, pageMeta, escapeRegex } = require('../utils/pagination');
const { toCsv } = require('../utils/csv');
const { audit } = require('../services/security/auditService');
const { participation, computeResults } = require('../services/voting/resultsService');
const { tickElections } = require('../services/voting/electionService');

const dashboard = asyncHandler(async (_req, res) => {
  await tickElections();
  const [total, approved, pending, rejected, unverifiedEmail, elections, active, upcoming, completed, drafts, candidates, recent] = await Promise.all([
    Voter.countDocuments({}),
    Voter.countDocuments({ verificationStatus: 'approved' }),
    Voter.countDocuments({ verificationStatus: 'pending' }),
    Voter.countDocuments({ verificationStatus: 'rejected' }),
    User.countDocuments({ role: 'voter', emailVerified: false }),
    Election.countDocuments({}),
    Election.countDocuments({ status: { $in: ['active', 'paused'] } }),
    Election.countDocuments({ status: 'scheduled' }),
    Election.countDocuments({ status: { $in: ['completed', 'published'] } }),
    Election.countDocuments({ status: 'draft' }),
    Candidate.countDocuments({}),
    Election.find({ status: { $ne: 'draft' } }).sort({ startTime: -1 }).limit(8),
  ]);
  const participationRows = await Promise.all(recent.map(async (e) => ({ id: e._id, title: e.title, status: e.status, ...(await participation(e)) })));
  const totalVotes = participationRows.reduce((s, r) => s + r.totalVotes, 0);
  const totalEligible = participationRows.reduce((s, r) => s + r.totalEligible, 0);
  const [recentEvents, recentAudit] = await Promise.all([
    SecurityEvent.find({}).sort({ createdAt: -1 }).limit(5),
    AuditLog.find({}).sort({ createdAt: -1 }).limit(6),
  ]);
  res.json({
    success: true,
    data: {
      voters: { total, verified: approved, pending, rejected, emailUnverified: unverifiedEmail },
      elections: { total: elections, active, upcoming, completed, draft: drafts },
      candidates,
      participation: { totalVotes, totalEligible, turnoutPercent: totalEligible ? Math.round((totalVotes / totalEligible) * 10000) / 100 : 0, byElection: participationRows },
      recentSecurityEvents: recentEvents,
      recentAudit: recentAudit.map((a) => ({ id: a._id, action: a.action, description: a.description, actorEmail: a.actorEmail, createdAt: a.createdAt })),
    },
  });
});

function dateRange(query) {
  const r = {};
  if (query.from) { const d = new Date(query.from); if (!Number.isNaN(d.getTime())) r.$gte = d; }
  if (query.to) { const d = new Date(query.to); if (!Number.isNaN(d.getTime())) { d.setHours(23, 59, 59, 999); r.$lte = d; } }
  return Object.keys(r).length ? r : null;
}

const auditLogs = asyncHandler(async (req, res) => {
  const paging = parsePaging(req.query, { defaultLimit: 15, allowedSort: ['createdAt', 'action'], defaultSort: '-createdAt' });
  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.role) filter.actorRole = req.query.role;
  const range = dateRange(req.query);
  if (range) filter.createdAt = range;
  if (req.query.q) {
    const rx = { $regex: escapeRegex(req.query.q), $options: 'i' };
    filter.$or = [{ description: rx }, { actorEmail: rx }, { action: rx }, { targetId: rx }];
  }
  const [rows, total, actions] = await Promise.all([
    AuditLog.find(filter).sort(paging.sort).skip(paging.skip).limit(paging.limit),
    AuditLog.countDocuments(filter),
    AuditLog.distinct('action'),
  ]);
  res.json({ success: true, data: rows, meta: { ...pageMeta(total, paging), actions: actions.sort() } });
});

const securityEvents = asyncHandler(async (req, res) => {
  const paging = parsePaging(req.query, { defaultLimit: 15, allowedSort: ['createdAt', 'severity', 'type'], defaultSort: '-createdAt' });
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.severity) filter.severity = req.query.severity;
  const range = dateRange(req.query);
  if (range) filter.createdAt = range;
  if (req.query.q) {
    const rx = { $regex: escapeRegex(req.query.q), $options: 'i' };
    filter.$or = [{ details: rx }, { email: rx }, { ip: rx }, { path: rx }];
  }
  const [rows, total, bySeverity] = await Promise.all([
    SecurityEvent.find(filter).sort(paging.sort).skip(paging.skip).limit(paging.limit),
    SecurityEvent.countDocuments(filter),
    SecurityEvent.aggregate([{ $group: { _id: '$severity', n: { $sum: 1 } } }]),
  ]);
  res.json({
    success: true, data: rows,
    meta: { ...pageMeta(total, paging), types: SecurityEvent.TYPES, severityCounts: Object.fromEntries(bySeverity.map((s) => [s._id, s.n])) },
  });
});

/* -------------------------------- Reports --------------------------------- */
async function buildReport(electionId) {
  const e = await Election.findById(electionId).populate('constituencies', 'name code');
  if (!e) throw new AppError('Election not found.', 404, 'NOT_FOUND');
  if (!['completed', 'published'].includes(e.status)) {
    throw new AppError('Reports with candidate-wise results are available once the election has been closed.', 409, 'REPORT_NOT_AVAILABLE');
  }
  const r = await computeResults(e);
  const ballots = await AnonymousBallot.countDocuments({ election: e._id });
  return { election: e, results: r, ballots };
}

const reportJson = asyncHandler(async (req, res) => {
  const { election, results } = await buildReport(req.params.id);
  res.json({
    success: true,
    data: {
      election: { id: election._id, title: election.title, status: election.status, startTime: election.startTime, endTime: election.endTime, type: election.type },
      ...results, generatedAt: new Date(),
    },
  });
});

const safeName = (s) => String(s).replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 60) || 'election';

const reportCsv = asyncHandler(async (req, res) => {
  const { election, results } = await buildReport(req.params.id);
  const rows = [
    ['ElexGuard Election Report'],
    ['Election', election.title],
    ['Status', election.status],
    ['Voting period', `${election.startTime.toISOString()} to ${election.endTime.toISOString()}`],
    ['Generated at', new Date()],
    ['Total eligible voters', results.totalEligible],
    ['Total votes cast', results.totalVotes],
    ['Turnout (%)', results.turnoutPercent],
    [],
    ['Candidate-wise results'],
    ['Rank', 'Candidate', 'Party', 'Votes', 'Vote share (%)'],
    ...results.candidates.map((c, i) => [i + 1, c.name, c.party, c.votes, c.percent]),
    [],
    ['Constituency-wise statistics'],
    ['Constituency', 'Code', 'Eligible voters', 'Votes cast', 'Turnout (%)'],
    ...results.constituencies.map((c) => [c.name, c.code, c.eligible, c.votes, c.turnoutPercent]),
    [],
    ['Note', 'Aggregated from anonymous ballots. Individual voter choices are not stored or exported.'],
  ];
  await audit(req, 'REPORT_EXPORTED', { targetType: 'Election', targetId: election._id, description: 'CSV report exported.', metadata: { format: 'csv' } });
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="elexguard-${safeName(election.title)}.csv"`,
  });
  res.send(`﻿${toCsv(rows)}`);
});

const reportPdf = asyncHandler(async (req, res) => {
  const { election, results } = await buildReport(req.params.id);
  await audit(req, 'REPORT_EXPORTED', { targetType: 'Election', targetId: election._id, description: 'PDF report exported.', metadata: { format: 'pdf' } });
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="elexguard-${safeName(election.title)}.pdf"`,
  });
  const doc = new PDFDocument({ margin: 48, size: 'A4', info: { Title: `ElexGuard report – ${election.title}`, Author: 'ElexGuard' } });
  doc.pipe(res);
  const navy = '#142B4F'; const blue = '#2563EB'; const grey = '#64748B';

  doc.rect(0, 0, doc.page.width, 70).fill(navy);
  doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('ElexGuard', 48, 22);
  doc.fontSize(10).font('Helvetica').text('Election Results Report', 48, 48);
  doc.fillColor(navy).font('Helvetica-Bold').fontSize(18).text(election.title, 48, 95);
  doc.font('Helvetica').fontSize(10).fillColor(grey)
    .text(`Status: ${election.status}   |   Voting period: ${election.startTime.toLocaleString('en-GB')} – ${election.endTime.toLocaleString('en-GB')}`)
    .text(`Generated: ${new Date().toLocaleString('en-GB')}`);
  doc.moveDown();

  const stat = (label, value, x) => {
    doc.roundedRect(x, doc.y, 150, 52, 4).lineWidth(0.7).strokeColor('#E5E7EB').stroke();
    doc.fillColor(grey).fontSize(9).text(label, x + 10, doc.y + 8, { width: 130 });
    doc.fillColor(blue).font('Helvetica-Bold').fontSize(18).text(String(value), x + 10, doc.y + 4, { width: 130 });
    doc.font('Helvetica');
  };
  const y0 = doc.y;
  doc.y = y0; stat('Eligible voters', results.totalEligible, 48);
  doc.y = y0; stat('Votes cast', results.totalVotes, 213);
  doc.y = y0; stat('Turnout', `${results.turnoutPercent}%`, 378);
  doc.y = y0 + 70;

  const table = (title, head, rows, widths) => {
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(13).text(title, 48, doc.y);
    doc.moveDown(0.4);
    let y = doc.y;
    const drawRow = (cells, bold, shade) => {
      if (y > 760) { doc.addPage(); y = 48; }
      if (shade) doc.rect(48, y - 3, 500, 18).fill(shade);
      let x = 52;
      cells.forEach((c, i) => {
        doc.fillColor(bold ? navy : '#1F2937').font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9.5)
          .text(String(c), x, y, { width: widths[i] - 6, ellipsis: true, lineBreak: false });
        x += widths[i];
      });
      y += 18;
    };
    drawRow(head, true, '#DBEAFE');
    rows.forEach((r, i) => drawRow(r, false, i % 2 ? '#F5F7FA' : null));
    doc.y = y + 14;
  };

  table('Candidate-wise results', ['Rank', 'Candidate', 'Party', 'Votes', 'Share'],
    results.candidates.map((c, i) => [i + 1, c.name, c.party, c.votes, `${c.percent}%`]), [45, 170, 140, 70, 75]);
  table('Constituency-wise statistics', ['Constituency', 'Code', 'Eligible', 'Votes', 'Turnout'],
    results.constituencies.map((c) => [c.name, c.code, c.eligible, c.votes, `${c.turnoutPercent}%`]), [160, 70, 90, 90, 90]);

  if (results.winner) {
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(12)
      .text(results.winner.tie ? 'Result: tie at the top – no single winner.' : `Leading candidate: ${results.winner.name} (${results.winner.party}) – ${results.winner.votes} votes`, 48);
  }
  doc.moveDown();
  doc.fillColor(grey).font('Helvetica-Oblique').fontSize(8.5)
    .text('Aggregated from anonymous ballots. Individual voter selections are not stored with voter identities and are not part of this report. ElexGuard is an educational prototype and is not certified for real elections.', 48, doc.y, { width: 500 });
  doc.end();
});

module.exports = { dashboard, auditLogs, securityEvents, reportJson, reportCsv, reportPdf };
