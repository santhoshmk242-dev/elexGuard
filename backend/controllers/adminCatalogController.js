'use strict';
const { Candidate, Election, Constituency, Voter, Notice, ContactMessage } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { parsePaging, pageMeta, escapeRegex } = require('../utils/pagination');
const { audit } = require('../services/security/auditService');

/* ------------------------------ Candidates ------------------------------ */
const candidateShape = (c) => ({
  id: c._id, election: c.election, name: c.name, party: c.party, symbol: c.symbol, manifesto: c.manifesto,
  biography: c.biography, photoUrl: c.photoUrl, hasPhoto: c.hasPhoto, createdAt: c.createdAt,
});

async function assertEditableElection(electionId) {
  const e = await Election.findById(electionId);
  if (!e) throw new AppError('Election not found.', 404, 'NOT_FOUND');
  if (!['draft', 'scheduled'].includes(e.status)) {
    throw new AppError('Candidates can only be changed while the election is a draft or scheduled.', 409, 'ELECTION_LOCKED');
  }
  return e;
}

const listCandidates = asyncHandler(async (req, res) => {
  const paging = parsePaging(req.query, { allowedSort: ['name', 'party', 'createdAt'], defaultSort: 'name' });
  const filter = {};
  if (req.query.election) filter.election = req.query.election;
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
    data: rows.map((c) => ({ ...candidateShape(c), election: c.election ? { id: c.election._id, title: c.election.title, status: c.election.status } : null })),
    meta: pageMeta(total, paging),
  });
});

const getCandidate = asyncHandler(async (req, res) => {
  const c = await Candidate.findById(req.params.id);
  if (!c) throw new AppError('Candidate not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: candidateShape(c) });
});

const createCandidate = asyncHandler(async (req, res) => {
  const e = await assertEditableElection(req.body.election);
  const doc = { ...req.body, election: e._id };
  if (req.photo) { doc.photo = req.photo; doc.hasPhoto = true; }
  const c = await Candidate.create(doc);
  await audit(req, 'CANDIDATE_ADDED', { targetType: 'Candidate', targetId: c._id, description: `Candidate "${c.name}" added to "${e.title}".` });
  res.status(201).json({ success: true, message: 'Candidate added.', data: candidateShape(c) });
});

const updateCandidate = asyncHandler(async (req, res) => {
  const c = await Candidate.findById(req.params.id);
  if (!c) throw new AppError('Candidate not found.', 404, 'NOT_FOUND');
  await assertEditableElection(c.election);
  Object.assign(c, req.body);
  if (req.photo) { c.photo = req.photo; c.hasPhoto = true; }
  await c.save();
  await audit(req, 'CANDIDATE_UPDATED', { targetType: 'Candidate', targetId: c._id, description: `Candidate "${c.name}" updated.` });
  res.json({ success: true, message: 'Candidate updated.', data: candidateShape(c) });
});

const removeCandidate = asyncHandler(async (req, res) => {
  const c = await Candidate.findById(req.params.id);
  if (!c) throw new AppError('Candidate not found.', 404, 'NOT_FOUND');
  await assertEditableElection(c.election);
  await c.deleteOne();
  await audit(req, 'CANDIDATE_REMOVED', { targetType: 'Candidate', targetId: c._id, description: `Candidate "${c.name}" removed.` });
  res.json({ success: true, message: 'Candidate removed.' });
});

/* ----------------------------- Constituencies ---------------------------- */
const listConstituencies = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.q) {
    const rx = { $regex: escapeRegex(req.query.q), $options: 'i' };
    filter.$or = [{ name: rx }, { code: rx }, { region: rx }];
  }
  const rows = await Constituency.find(filter).sort({ name: 1 });
  const counts = await Voter.aggregate([{ $group: { _id: '$constituency', n: { $sum: 1 } } }]);
  const m = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json({
    success: true,
    data: rows.map((c) => ({ id: c._id, name: c.name, code: c.code, region: c.region, description: c.description, voterCount: m.get(String(c._id)) || 0 })),
  });
});

const createConstituency = asyncHandler(async (req, res) => {
  const c = await Constituency.create(req.body);
  await audit(req, 'CONSTITUENCY_CREATED', { targetType: 'Constituency', targetId: c._id, description: `Constituency "${c.name}" created.` });
  res.status(201).json({ success: true, message: 'Constituency created.', data: { id: c._id, name: c.name, code: c.code, region: c.region, description: c.description } });
});

const updateConstituency = asyncHandler(async (req, res) => {
  const c = await Constituency.findById(req.params.id);
  if (!c) throw new AppError('Constituency not found.', 404, 'NOT_FOUND');
  Object.assign(c, req.body);
  await c.save();
  await audit(req, 'CONSTITUENCY_UPDATED', { targetType: 'Constituency', targetId: c._id, description: `Constituency "${c.name}" updated.` });
  res.json({ success: true, message: 'Constituency updated.', data: { id: c._id, name: c.name, code: c.code, region: c.region, description: c.description } });
});

const removeConstituency = asyncHandler(async (req, res) => {
  const c = await Constituency.findById(req.params.id);
  if (!c) throw new AppError('Constituency not found.', 404, 'NOT_FOUND');
  const [voters, elections] = await Promise.all([
    Voter.countDocuments({ constituency: c._id }),
    Election.countDocuments({ constituencies: c._id }),
  ]);
  if (voters || elections) {
    throw new AppError(`Cannot delete: ${voters} voter(s) and ${elections} election(s) reference this constituency.`, 409, 'IN_USE');
  }
  await c.deleteOne();
  await audit(req, 'CONSTITUENCY_DELETED', { targetType: 'Constituency', targetId: c._id, description: `Constituency "${c.name}" deleted.` });
  res.json({ success: true, message: 'Constituency deleted.' });
});

/* ------------------------- Notices & contact inbox ------------------------ */
const listNotices = asyncHandler(async (_req, res) => {
  const rows = await Notice.find({}).sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: rows.map((n) => ({ id: n._id, title: n.title, body: n.body, kind: n.kind, createdAt: n.createdAt })) });
});
const createNotice = asyncHandler(async (req, res) => {
  const n = await Notice.create({ ...req.body, createdBy: req.user._id });
  await audit(req, 'NOTICE_PUBLISHED', { targetType: 'Notice', targetId: n._id, description: `Public notice "${n.title}" published.` });
  res.status(201).json({ success: true, message: 'Notice published.', data: { id: n._id, title: n.title, body: n.body, kind: n.kind, createdAt: n.createdAt } });
});
const deleteNotice = asyncHandler(async (req, res) => {
  const n = await Notice.findById(req.params.id);
  if (!n) throw new AppError('Notice not found.', 404, 'NOT_FOUND');
  await n.deleteOne();
  await audit(req, 'NOTICE_DELETED', { targetType: 'Notice', targetId: n._id, description: 'Public notice deleted.' });
  res.json({ success: true, message: 'Notice deleted.' });
});
const listMessages = asyncHandler(async (req, res) => {
  const paging = parsePaging(req.query, { allowedSort: ['createdAt'], defaultSort: '-createdAt' });
  const [rows, total] = await Promise.all([
    ContactMessage.find({}).sort(paging.sort).skip(paging.skip).limit(paging.limit),
    ContactMessage.countDocuments({}),
  ]);
  res.json({ success: true, data: rows, meta: pageMeta(total, paging) });
});
const handleMessage = asyncHandler(async (req, res) => {
  const m = await ContactMessage.findByIdAndUpdate(req.params.id, { $set: { handled: true } }, { new: true });
  if (!m) throw new AppError('Message not found.', 404, 'NOT_FOUND');
  res.json({ success: true, message: 'Marked as handled.', data: m });
});

module.exports = {
  listCandidates, getCandidate, createCandidate, updateCandidate, removeCandidate,
  listConstituencies, createConstituency, updateConstituency, removeConstituency,
  listNotices, createNotice, deleteNotice, listMessages, handleMessage,
};
