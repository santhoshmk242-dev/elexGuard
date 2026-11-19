'use strict';
const { Election, Candidate, VoterEligibility, AnonymousBallot } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { parsePaging, pageMeta, escapeRegex } = require('../utils/pagination');
const { audit } = require('../services/security/auditService');
const { transition, tickElections } = require('../services/voting/electionService');
const { participation, computeResults } = require('../services/voting/resultsService');

const shape = (e, extra = {}) => ({
  id: e._id, title: e.title, description: e.description, type: e.type, status: e.status,
  startTime: e.startTime, endTime: e.endTime, startedAt: e.startedAt, endedAt: e.endedAt, resultsPublishedAt: e.resultsPublishedAt,
  constituencies: (e.constituencies || []).map((c) => (c.name ? { id: c._id, name: c.name, code: c.code } : { id: c })),
  createdAt: e.createdAt, ...extra,
});

const list = asyncHandler(async (req, res) => {
  await tickElections();
  const paging = parsePaging(req.query, { allowedSort: ['title', 'status', 'startTime', 'endTime', 'createdAt'], defaultSort: '-createdAt' });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) filter.title = { $regex: escapeRegex(req.query.q), $options: 'i' };
  const [rows, total] = await Promise.all([
    Election.find(filter).populate('constituencies', 'name code').sort(paging.sort).skip(paging.skip).limit(paging.limit),
    Election.countDocuments(filter),
  ]);
  const data = await Promise.all(rows.map(async (e) => shape(e, {
    candidateCount: await Candidate.countDocuments({ election: e._id }),
    votesCast: await AnonymousBallot.countDocuments({ election: e._id }),
  })));
  res.json({ success: true, data, meta: pageMeta(total, paging) });
});

const get = asyncHandler(async (req, res) => {
  const e = await Election.findById(req.params.id).populate('constituencies', 'name code');
  if (!e) throw new AppError('Election not found.', 404, 'NOT_FOUND');
  const [candidates, part] = await Promise.all([Candidate.find({ election: e._id }).sort({ name: 1 }), participation(e)]);
  res.json({
    success: true,
    data: shape(e, {
      candidates: candidates.map((c) => ({ id: c._id, name: c.name, party: c.party, symbol: c.symbol, hasPhoto: c.hasPhoto, photoUrl: c.photoUrl })),
      participation: part,
    }),
  });
});

const create = asyncHandler(async (req, res) => {
  const e = await Election.create({ ...req.body, createdBy: req.user._id, status: 'draft' });
  await audit(req, 'ELECTION_CREATED', { targetType: 'Election', targetId: e._id, description: `Election "${e.title}" created.` });
  res.status(201).json({ success: true, message: 'Election created as draft.', data: shape(e) });
});

const update = asyncHandler(async (req, res) => {
  const e = await Election.findById(req.params.id);
  if (!e) throw new AppError('Election not found.', 404, 'NOT_FOUND');
  if (!['draft', 'scheduled'].includes(e.status)) {
    throw new AppError('Only draft or scheduled elections can be edited. Use "Manage duration" to change the end time of a running election.', 409, 'ELECTION_LOCKED');
  }
  Object.assign(e, req.body);
  if (e.endTime <= e.startTime) throw new AppError('End time must be after start time.', 400, 'VALIDATION_ERROR', { fields: { endTime: 'End time must be after start time' } });
  await e.save();
  await audit(req, 'ELECTION_UPDATED', { targetType: 'Election', targetId: e._id, description: `Election "${e.title}" updated.`, metadata: { fields: Object.keys(req.body) } });
  res.json({ success: true, message: 'Election updated.', data: shape(e) });
});

const remove = asyncHandler(async (req, res) => {
  const e = await Election.findById(req.params.id);
  if (!e) throw new AppError('Election not found.', 404, 'NOT_FOUND');
  if (e.status !== 'draft') throw new AppError('Only draft elections can be deleted.', 409, 'ELECTION_LOCKED');
  await Promise.all([Candidate.deleteMany({ election: e._id }), VoterEligibility.deleteMany({ election: e._id }), e.deleteOne()]);
  await audit(req, 'ELECTION_DELETED', { targetType: 'Election', targetId: e._id, description: `Draft election "${e.title}" deleted.` });
  res.json({ success: true, message: 'Draft election deleted.' });
});

const LIFECYCLE_MESSAGES = {
  schedule: 'Election scheduled.', start: 'Election started. Voting is now open.', pause: 'Election paused.',
  resume: 'Election resumed.', end: 'Election closed. Voting has ended.', publish: 'Results published.',
};

const lifecycle = (action) => asyncHandler(async (req, res) => {
  const { election, auditAction } = await transition(req.params.id, action, req.user._id);
  await audit(req, auditAction, { targetType: 'Election', targetId: election._id, description: `Election "${election.title}" → ${election.status}.` });
  res.json({ success: true, message: LIFECYCLE_MESSAGES[action], data: shape(election) });
});

const changeDuration = asyncHandler(async (req, res) => {
  const e = await Election.findById(req.params.id);
  if (!e) throw new AppError('Election not found.', 404, 'NOT_FOUND');
  if (!['scheduled', 'active', 'paused'].includes(e.status)) throw new AppError('Duration can only be changed for scheduled, active or paused elections.', 409, 'ELECTION_LOCKED');
  const { endTime } = req.body;
  if (endTime <= e.startTime) throw new AppError('End time must be after the start time.', 400, 'VALIDATION_ERROR', { fields: { endTime: 'Must be after start time' } });
  if (endTime <= new Date()) throw new AppError('End time must be in the future.', 400, 'VALIDATION_ERROR', { fields: { endTime: 'Must be in the future' } });
  const previous = e.endTime;
  e.endTime = endTime;
  await e.save();
  await audit(req, 'ELECTION_DURATION_CHANGED', {
    targetType: 'Election', targetId: e._id, description: `End time changed for "${e.title}".`,
    metadata: { previousEnd: previous, newEnd: endTime },
  });
  res.json({ success: true, message: 'Election duration updated.', data: shape(e) });
});

/** Admin view of results: tallies are only visible once voting has closed. */
const results = asyncHandler(async (req, res) => {
  const e = await Election.findById(req.params.id).populate('constituencies', 'name code');
  if (!e) throw new AppError('Election not found.', 404, 'NOT_FOUND');
  const part = await participation(e);
  if (!['completed', 'published'].includes(e.status)) {
    return res.json({
      success: true,
      data: { election: shape(e), tallyVisible: false, ...part, message: 'Candidate-wise results stay hidden until the election is closed.' },
    });
  }
  const r = await computeResults(e);
  return res.json({ success: true, data: { election: shape(e), tallyVisible: true, ...r } });
});

module.exports = {
  list, get, create, update, remove, changeDuration, results,
  schedule: lifecycle('schedule'), start: lifecycle('start'), pause: lifecycle('pause'),
  resume: lifecycle('resume'), end: lifecycle('end'), publish: lifecycle('publish'),
};
