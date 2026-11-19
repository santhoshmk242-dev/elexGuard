
'use strict';

const { Election, Candidate, Voter, VoterEligibility } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { parsePaging, pageMeta, escapeRegex } = require('../utils/pagination');
const workflow = require('../services/dfa/votingWorkflow');
const { submitVote } = require('../services/voting/voteService');
const { audit } = require('../services/security/auditService');

const VISIBLE = ['scheduled', 'active', 'paused', 'completed', 'published'];

async function loadVoter(req) {
  const voter = await Voter.findOne({ user: req.user._id })
    .populate('constituency', 'name code region');

  if (!voter) {
    throw new AppError('Voter profile not found.', 404, 'VOTER_NOT_FOUND');
  }

  return voter;
}

async function loadElection(id) {
  const e = await Election.findOne({
    _id: id,
    status: { $in: VISIBLE },
  }).populate('constituencies', 'name code');

  if (!e) {
    throw new AppError('Election not found.', 404, 'NOT_FOUND');
  }

  return e;
}

const shape = (e, voter, elig) => ({
  id: e._id,
  title: e.title,
  description: e.description,
  type: e.type,
  status: e.status,
  startTime: e.startTime,
  endTime: e.endTime,

  constituencies: (e.constituencies || []).map((c) => ({
    id: c._id,
    name: c.name,
    code: c.code,
  })),

  inMyConstituency: workflow.constituencyAllowed(e, voter),

  hasVoted: Boolean(elig && elig.hasVoted),

  receiptReference:
    elig && elig.hasVoted ? elig.receiptReference : null,
});


// VOTER DASHBOARD

const dashboard = asyncHandler(async (req, res) => {
  const voter = await loadVoter(req);

  // Get all visible elections without constituency filtering.
  const elections = await Election.find({
    status: { $in: VISIBLE },
  })
    .populate('constituencies', 'name code')
    .sort({ startTime: 1 });

  // Keep eligibility calculation separate from election visibility.
  const mine = elections.filter((e) =>
    workflow.constituencyAllowed(e, voter)
  );

  const eligs = await VoterEligibility.find({
    voter: voter._id,
  });

  const em = new Map(
    eligs.map((x) => [String(x.election), x])
  );

  const group = (list, ...statuses) =>
    list.filter((e) => statuses.includes(e.status));

  const active = group(elections, 'active', 'paused');
  const upcoming = group(elections, 'scheduled');
  const completed = group(elections, 'completed', 'published');

  res.json({
    success: true,
    data: {
      verification: {
        emailVerified: req.user.emailVerified,
        status: voter.verificationStatus,
        rejectionReason: voter.rejectionReason,
        constituency: voter.constituency,
      },

      counts: {
        eligible: mine.length,
        upcoming: upcoming.length,
        active: active.length,
        completed: completed.length,
        voted: eligs.filter((x) => x.hasVoted).length,
      },

      // Show all active elections.
      activeElections: active.map((e) =>
        shape(e, voter, em.get(String(e._id)))
      ),

      // Show all upcoming elections.
      upcomingElections: upcoming.map((e) =>
        shape(e, voter, em.get(String(e._id)))
      ),
    },
  });
});


// LIST ALL VISIBLE ELECTIONS

const listElections = asyncHandler(async (req, res) => {
  const voter = await loadVoter(req);

  const paging = parsePaging(req.query, {
    defaultLimit: 10,
    allowedSort: ['startTime', 'endTime', 'title'],
    defaultSort: 'startTime',
  });

  // Do not hide elections based on voter constituency.
  const filter = {
    status: { $in: VISIBLE },
  };

  const group = req.query.group;

  if (group === 'upcoming') {
    filter.status = 'scheduled';
  }

  if (group === 'active') {
    filter.status = { $in: ['active', 'paused'] };
  }

  if (group === 'completed') {
    filter.status = { $in: ['completed', 'published'] };
  }

  if (req.query.q) {
    filter.title = {
      $regex: escapeRegex(req.query.q),
      $options: 'i',
    };
  }

  const [rows, total] = await Promise.all([
    Election.find(filter)
      .populate('constituencies', 'name code')
      .sort(paging.sort)
      .skip(paging.skip)
      .limit(paging.limit),

    Election.countDocuments(filter),
  ]);

  const eligs = await VoterEligibility.find({
    voter: voter._id,
    election: { $in: rows.map((r) => r._id) },
  });

  const em = new Map(
    eligs.map((x) => [String(x.election), x])
  );

  res.json({
    success: true,
    data: rows.map((e) =>
      shape(e, voter, em.get(String(e._id)))
    ),
    meta: pageMeta(total, paging),
  });
});


// GET SINGLE ELECTION

const getElection = asyncHandler(async (req, res) => {
  const voter = await loadVoter(req);
  const e = await loadElection(req.params.id);

  const [candidates, check] = await Promise.all([
    Candidate.find({ election: e._id }).sort({ name: 1 }),

    workflow.checkEligibility({
      user: req.user,
      voter,
      election: e,
    }),
  ]);

  res.json({
    success: true,
    data: {
      ...shape(e, voter, null),

      hasVoted: check.hasVoted,
      receiptReference: check.receiptReference,

      candidates: candidates.map((c) => ({
        id: c._id,
        name: c.name,
        party: c.party,
        symbol: c.symbol,
        photoUrl: c.photoUrl,
      })),

      eligibility: check,
    },
  });
});


// GET CANDIDATE

const getCandidate = asyncHandler(async (req, res) => {
  const voter = await loadVoter(req);

  const c = await Candidate.findById(req.params.id)
    .populate('election');

  if (
    !c ||
    !c.election ||
    !VISIBLE.includes(c.election.status) ||
    !workflow.constituencyAllowed(c.election, voter)
  ) {
    throw new AppError('Candidate not found.', 404, 'NOT_FOUND');
  }

  res.json({
    success: true,
    data: {
      id: c._id,
      name: c.name,
      party: c.party,
      symbol: c.symbol,
      manifesto: c.manifesto,
      biography: c.biography,
      photoUrl: c.photoUrl,

      election: {
        id: c.election._id,
        title: c.election.title,
        status: c.election.status,
      },
    },
  });
});


// CHECK VOTER ELIGIBILITY

const eligibility = asyncHandler(async (req, res) => {
  const voter = await loadVoter(req);
  const e = await loadElection(req.params.id);

  res.json({
    success: true,
    data: await workflow.checkEligibility({
      user: req.user,
      voter,
      election: e,
    }),
  });
});


// GRANT BALLOT ACCESS

const ballotAccess = asyncHandler(async (req, res) => {
  const voter = await loadVoter(req);
  const e = await loadElection(req.params.id);

  const grant = await workflow.grantBallotAccess({
    req,
    user: req.user,
    voter,
    election: e,
  });

  const candidates = await Candidate.find({
    election: e._id,
  }).sort({ name: 1 });

  res.json({
    success: true,
    message: 'Ballot access granted.',

    data: {
      ballotToken: grant.token,
      expiresAt: grant.expiresAt,
      dfaState: grant.state,

      election: {
        id: e._id,
        title: e.title,
        endTime: e.endTime,
      },

      candidates: candidates.map((c) => ({
        id: c._id,
        name: c.name,
        party: c.party,
        symbol: c.symbol,
        manifesto: c.manifesto,
        photoUrl: c.photoUrl,
      })),
    },
  });
});


// CAST VOTE

const castVote = asyncHandler(async (req, res) => {
  const voter = await loadVoter(req);
  const e = await loadElection(req.params.id);

  const result = await submitVote({
    req,
    user: req.user,
    voter,
    election: e,
    candidateId: req.body.candidateId,
    ballotToken: req.body.ballotToken,
  });

  res.status(201).json({
    success: true,
    message: 'Your vote has been recorded securely.',

    data: {
      receiptReference: result.receiptReference,
      dfaState: result.state,
      dfaStateLabel: result.stateLabel,

      election: {
        id: e._id,
        title: e.title,
      },
    },
  });
});


// VOTING HISTORY

const history = asyncHandler(async (req, res) => {
  const voter = await loadVoter(req);

  const eligs = await VoterEligibility.find({
    voter: voter._id,
    hasVoted: true,
  }).sort({ votedAt: -1 });

  const elections = await Election.find({
    _id: { $in: eligs.map((x) => x.election) },
  });

  const em = new Map(
    elections.map((e) => [String(e._id), e])
  );

  res.json({
    success: true,

    data: eligs.map((x) => {
      const e = em.get(String(x.election));

      return {
        electionId: x.election,
        title: e ? e.title : 'Election',
        status: e ? e.status : '',
        receiptReference: x.receiptReference,
        votedAt: x.votedAt,
        resultsPublished: e ? e.status === 'published' : false,
      };
    }),
  });
});

module.exports = {
  dashboard,
  listElections,
  getElection,
  getCandidate,
  eligibility,
  ballotAccess,
  castVote,
  history,
};
