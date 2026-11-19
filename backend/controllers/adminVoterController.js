'use strict';
const { Voter, User, VoterEligibility, Election } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { parsePaging, pageMeta, escapeRegex } = require('../utils/pagination');
const { audit } = require('../services/security/auditService');

const shape = (v) => ({
  id: v._id,
  fullName: v.user ? v.user.fullName : '',
  email: v.user ? v.user.email : '',
  phone: v.user ? v.user.phone : '',
  emailVerified: v.user ? v.user.emailVerified : false,
  voterIdNumber: v.voterIdNumber,
  dateOfBirth: v.dateOfBirth,
  address: v.address,
  constituency: v.constituency ? { id: v.constituency._id, name: v.constituency.name, code: v.constituency.code } : null,
  verificationStatus: v.verificationStatus,
  rejectionReason: v.rejectionReason,
  reviewedAt: v.reviewedAt,
  registeredAt: v.createdAt,
});

const list = asyncHandler(async (req, res) => {
  const paging = parsePaging(req.query, { allowedSort: ['createdAt', 'verificationStatus', 'voterIdNumber'], defaultSort: '-createdAt' });
  const filter = {};
  if (['pending', 'approved', 'rejected'].includes(req.query.status)) filter.verificationStatus = req.query.status;
  if (req.query.constituency) filter.constituency = req.query.constituency;
  if (req.query.q) {
    const rx = { $regex: escapeRegex(req.query.q), $options: 'i' };
    const users = await User.find({ role: 'voter', $or: [{ fullName: rx }, { email: rx }] }).select('_id');
    filter.$or = [{ voterIdNumber: rx }, { user: { $in: users.map((u) => u._id) } }];
  }
  if (req.query.emailVerified === 'true' || req.query.emailVerified === 'false') {
    const users = await User.find({ role: 'voter', emailVerified: req.query.emailVerified === 'true' }).select('_id');
    filter.user = { $in: users.map((u) => u._id) };
  }
  const [rows, total] = await Promise.all([
    Voter.find(filter).populate('user', 'fullName email phone emailVerified').populate('constituency', 'name code')
      .sort(paging.sort).skip(paging.skip).limit(paging.limit),
    Voter.countDocuments(filter),
  ]);
  res.json({ success: true, data: rows.map(shape), meta: pageMeta(total, paging) });
});

const get = asyncHandler(async (req, res) => {
  const v = await Voter.findById(req.params.id).populate('user', 'fullName email phone emailVerified lastLoginAt').populate('constituency', 'name code');
  if (!v) throw new AppError('Voter not found.', 404, 'NOT_FOUND');
  // Participation only (which elections they voted in) – never what they voted for.
  const eligs = await VoterEligibility.find({ voter: v._id });
  const elections = await Election.find({ _id: { $in: eligs.map((e) => e.election) } }).select('title status');
  const em = new Map(elections.map((e) => [String(e._id), e]));
  res.json({
    success: true,
    data: {
      ...shape(v), lastLoginAt: v.user ? v.user.lastLoginAt : null,
      participation: eligs.map((x) => ({
        electionId: x.election, title: em.get(String(x.election)) ? em.get(String(x.election)).title : 'Election', hasVoted: x.hasVoted, dfaState: x.dfaState,
      })),
    },
  });
});

const approve = asyncHandler(async (req, res) => {
  const v = await Voter.findById(req.params.id).populate('user', 'fullName email emailVerified');
  if (!v) throw new AppError('Voter not found.', 404, 'NOT_FOUND');
  if (!v.user.emailVerified) throw new AppError('The voter has not verified their email address yet.', 409, 'EMAIL_NOT_VERIFIED');
  if (v.verificationStatus === 'approved') throw new AppError('Voter is already approved.', 409, 'ALREADY_APPROVED');
  v.verificationStatus = 'approved';
  v.rejectionReason = '';
  v.reviewedBy = req.user._id;
  v.reviewedAt = new Date();
  await v.save();
  await audit(req, 'VOTER_APPROVED', { targetType: 'Voter', targetId: v._id, description: `Voter ${v.voterIdNumber} approved.` });
  res.json({ success: true, message: 'Voter approved.', data: { id: v._id, verificationStatus: v.verificationStatus } });
});

const reject = asyncHandler(async (req, res) => {
  const v = await Voter.findById(req.params.id);
  if (!v) throw new AppError('Voter not found.', 404, 'NOT_FOUND');
  v.verificationStatus = 'rejected';
  v.rejectionReason = req.body.reason;
  v.reviewedBy = req.user._id;
  v.reviewedAt = new Date();
  await v.save();
  await audit(req, 'VOTER_REJECTED', { targetType: 'Voter', targetId: v._id, description: `Voter ${v.voterIdNumber} rejected.`, metadata: { reason: req.body.reason } });
  res.json({ success: true, message: 'Voter rejected.', data: { id: v._id, verificationStatus: v.verificationStatus } });
});

module.exports = { list, get, approve, reject };
