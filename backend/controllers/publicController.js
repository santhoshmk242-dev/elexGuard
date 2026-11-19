'use strict';
const { Election, Candidate, Constituency, Notice, ElectionResult, ContactMessage, Voter, AnonymousBallot } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { parsePaging, pageMeta, escapeRegex } = require('../utils/pagination');
const { participation } = require('../services/voting/resultsService');
const { votingDfa } = require('../services/dfa/dfaEngine');
const { audit } = require('../services/security/auditService');
const mongoose = require('mongoose');

const PUBLIC_STATUSES = ['scheduled', 'active', 'paused', 'completed', 'published'];

function electionPublicShape(e, extra = {}) {
  return {
    id: e._id, title: e.title, description: e.description, type: e.type, status: e.status,
    startTime: e.startTime, endTime: e.endTime, resultsPublishedAt: e.resultsPublishedAt,
    constituencies: (e.constituencies || []).map((c) => (c.name ? { id: c._id, name: c.name, code: c.code } : { id: c })),
    ...extra,
  };
}

const health = (_req, res) => {
  res.json({
    success: true, status: 'ok', service: 'elexguard-api', time: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', uptimeSeconds: Math.round(process.uptime()),
  });
};

const stats = asyncHandler(async (_req, res) => {
  const [elections, active, upcoming, completed, voters, constituencies] = await Promise.all([
    Election.countDocuments({ status: { $in: PUBLIC_STATUSES } }),
    Election.countDocuments({ status: 'active' }),
    Election.countDocuments({ status: 'scheduled' }),
    Election.countDocuments({ status: { $in: ['completed', 'published'] } }),
    Voter.countDocuments({ verificationStatus: 'approved' }),
    Constituency.countDocuments({}),
  ]);
  res.json({ success: true, data: { elections, active, upcoming, completed, registeredVoters: voters, constituencies } });
});

const listElections = asyncHandler(async (req, res) => {
  const paging = parsePaging(req.query, { defaultLimit: 9, allowedSort: ['startTime', 'endTime', 'title', 'createdAt'], defaultSort: 'startTime' });
  const filter = { status: { $in: PUBLIC_STATUSES } };
  if (req.query.status && PUBLIC_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.group === 'upcoming') filter.status = 'scheduled';
  if (req.query.group === 'active') filter.status = { $in: ['active', 'paused'] };
  if (req.query.group === 'completed') filter.status = { $in: ['completed', 'published'] };
  if (req.query.q) filter.title = { $regex: escapeRegex(req.query.q), $options: 'i' };
  const [rows, total] = await Promise.all([
    Election.find(filter).populate('constituencies', 'name code').sort(paging.sort).skip(paging.skip).limit(paging.limit),
    Election.countDocuments(filter),
  ]);
  const withCounts = await Promise.all(rows.map(async (e) => electionPublicShape(e, { candidateCount: await Candidate.countDocuments({ election: e._id }) })));
  res.json({ success: true, data: withCounts, meta: pageMeta(total, paging) });
});

const getElection = asyncHandler(async (req, res) => {
  const e = await Election.findOne({ _id: req.params.id, status: { $in: PUBLIC_STATUSES } }).populate('constituencies', 'name code region');
  if (!e) throw new AppError('Election not found.', 404, 'NOT_FOUND');
  const candidates = await Candidate.find({ election: e._id }).sort({ name: 1 });
  // Turnout counters are public; candidate tallies are NOT, until results are published.
  const part = ['completed', 'published', 'active', 'paused'].includes(e.status) ? await participation(e) : null;
  res.json({
    success: true,
    data: electionPublicShape(e, {
      candidates: candidates.map((c) => ({ id: c._id, name: c.name, party: c.party, symbol: c.symbol, photoUrl: c.photoUrl })),
      participation: part,
    }),
  });
});

const listCandidates = asyncHandler(async (req, res) => {
  const paging = parsePaging(req.query, { defaultLimit: 12, allowedSort: ['name', 'party', 'createdAt'], defaultSort: 'name' });
  const visible = await Election.find({ status: { $in: PUBLIC_STATUSES } }).select('_id title status');
  const visibleIds = visible.map((e) => e._id);
  const filter = { election: { $in: visibleIds } };
  if (req.query.election && mongoose.isValidObjectId(req.query.election)) {
    filter.election = visibleIds.find((id) => String(id) === req.query.election) || null;
  }
  if (req.query.q) {
    const rx = { $regex: escapeRegex(req.query.q), $options: 'i' };
    filter.$or = [{ name: rx }, { party: rx }];
  }
  const [rows, total] = await Promise.all([
    Candidate.find(filter).populate('election', 'title status').sort(paging.sort).skip(paging.skip).limit(paging.limit),
    Candidate.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data: rows.map((c) => ({
      id: c._id, name: c.name, party: c.party, symbol: c.symbol, photoUrl: c.photoUrl,
      election: c.election ? { id: c.election._id, title: c.election.title, status: c.election.status } : null,
    })),
    meta: pageMeta(total, paging),
  });
});

const getCandidate = asyncHandler(async (req, res) => {
  const c = await Candidate.findById(req.params.id).populate('election', 'title status startTime endTime');
  if (!c || !c.election || !PUBLIC_STATUSES.includes(c.election.status)) throw new AppError('Candidate not found.', 404, 'NOT_FOUND');
  res.json({
    success: true,
    data: {
      id: c._id, name: c.name, party: c.party, symbol: c.symbol, manifesto: c.manifesto, biography: c.biography, photoUrl: c.photoUrl,
      election: { id: c.election._id, title: c.election.title, status: c.election.status, startTime: c.election.startTime, endTime: c.election.endTime },
    },
  });
});

const candidatePhoto = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError('Photo not found.', 404, 'NOT_FOUND');
  const c = await Candidate.findById(req.params.id).select('+photo.data +photo.contentType hasPhoto election');
  if (!c || !c.hasPhoto || !c.photo || !c.photo.data) throw new AppError('Photo not found.', 404, 'NOT_FOUND');
  res.set('Content-Type', c.photo.contentType);
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Cache-Control', 'public, max-age=300');
  res.send(c.photo.data);
});

const listConstituencies = asyncHandler(async (_req, res) => {
  const rows = await Constituency.find({}).sort({ name: 1 });
  const counts = await Voter.aggregate([{ $match: { verificationStatus: 'approved' } }, { $group: { _id: '$constituency', n: { $sum: 1 } } }]);
  const m = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json({
    success: true,
    data: rows.map((c) => ({ id: c._id, name: c.name, code: c.code, region: c.region, description: c.description, registeredVoters: m.get(String(c._id)) || 0 })),
  });
});

const listNotices = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const rows = await Notice.find({}).sort({ createdAt: -1 }).limit(limit);
  res.json({ success: true, data: rows.map((n) => ({ id: n._id, title: n.title, body: n.body, kind: n.kind, createdAt: n.createdAt })) });
});

const listResults = asyncHandler(async (_req, res) => {
  const elections = await Election.find({ status: 'published' }).sort({ resultsPublishedAt: -1 });
  const snaps = await ElectionResult.find({ election: { $in: elections.map((e) => e._id) } });
  const sm = new Map(snaps.map((s) => [String(s.election), s]));
  res.json({
    success: true,
    data: elections.map((e) => {
      const s = sm.get(String(e._id));
      return {
        id: e._id, title: e.title, type: e.type, resultsPublishedAt: e.resultsPublishedAt,
        totalVotes: s ? s.totalVotes : 0, totalEligible: s ? s.totalEligible : 0, turnoutPercent: s ? s.turnoutPercent : 0, winner: s ? s.winner : null,
      };
    }),
  });
});

const getResults = asyncHandler(async (req, res) => {
  const e = await Election.findOne({ _id: req.params.id, status: 'published' });
  // Identical response for hidden / unknown elections: results stay hidden until publication.
  if (!e) throw new AppError('Results are not published for this election.', 404, 'RESULTS_NOT_PUBLISHED');
  const snap = await ElectionResult.findOne({ election: e._id });
  if (!snap) throw new AppError('Results are not published for this election.', 404, 'RESULTS_NOT_PUBLISHED');
  const cand = await Candidate.find({ election: e._id }).select('hasPhoto');
  const photo = new Map(cand.map((c) => [String(c._id), c.hasPhoto ? `/api/candidates/${c._id}/photo` : null]));
  res.json({
    success: true,
    data: {
      election: { id: e._id, title: e.title, type: e.type, startTime: e.startTime, endTime: e.endTime, resultsPublishedAt: e.resultsPublishedAt },
      totalEligible: snap.totalEligible, totalVotes: snap.totalVotes, turnoutPercent: snap.turnoutPercent,
      candidates: snap.candidates.map((c) => ({ id: c.candidate, name: c.name, party: c.party, votes: c.votes, percent: c.percent, photoUrl: photo.get(String(c.candidate)) || null })),
      constituencies: snap.constituencies, winner: snap.winner,
    },
  });
});

const dfaDefinition = (_req, res) => {
  res.json({ success: true, data: { ...votingDfa.definition(), transitionTable: votingDfa.transitionTable().filter((r) => r.to !== 'SX') } });
};

const contact = asyncHandler(async (req, res) => {
  const doc = await ContactMessage.create(req.body);
  await audit(req, 'CONTACT_MESSAGE_RECEIVED', { targetType: 'ContactMessage', targetId: doc._id, description: 'Contact form submitted.' });
  res.status(201).json({ success: true, message: 'Thank you. Your message has been received and will be reviewed by the election office.' });
});

module.exports = {
  health, stats, listElections, getElection, listCandidates, getCandidate, candidatePhoto,
  listConstituencies, listNotices, listResults, getResults, dfaDefinition, contact, AnonymousBallot,
};
