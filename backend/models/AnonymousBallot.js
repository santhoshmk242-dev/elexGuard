'use strict';
const crypto = require('crypto');
const { Schema, model } = require('mongoose');

// An anonymous ballot deliberately has:
//   * NO voter reference,
//   * NO createdAt/updatedAt timestamps,
//   * a RANDOM string _id (a normal ObjectId embeds its creation time, which would
//     allow ballots to be correlated with submission times).
const anonymousBallotSchema = new Schema(
  {
    _id: { type: String, default: () => crypto.randomBytes(16).toString('hex') },
    election: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
    candidate: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    constituency: { type: Schema.Types.ObjectId, ref: 'Constituency', required: true },
  },
  { timestamps: false, versionKey: false }
);
anonymousBallotSchema.index({ election: 1, candidate: 1 });
anonymousBallotSchema.index({ election: 1, constituency: 1 });

module.exports = model('AnonymousBallot', anonymousBallotSchema);
