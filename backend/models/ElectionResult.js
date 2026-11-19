'use strict';
const { Schema, model } = require('mongoose');

// Immutable snapshot of aggregated results, written when results are published.
const electionResultSchema = new Schema(
  {
    election: { type: Schema.Types.ObjectId, ref: 'Election', required: true, unique: true },
    totalEligible: { type: Number, required: true },
    totalVotes: { type: Number, required: true },
    turnoutPercent: { type: Number, required: true },
    candidates: [
      {
        candidate: { type: Schema.Types.ObjectId, ref: 'Candidate' },
        name: String,
        party: String,
        votes: Number,
        percent: Number,
        _id: false,
      },
    ],
    constituencies: [
      {
        constituency: { type: Schema.Types.ObjectId, ref: 'Constituency' },
        name: String,
        code: String,
        eligible: Number,
        votes: Number,
        turnoutPercent: Number,
        _id: false,
      },
    ],
    winner: { name: String, party: String, votes: Number, tie: Boolean, _id: false },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = model('ElectionResult', electionResultSchema);
