'use strict';
const { Schema, model } = require('mongoose');

const STATUSES = ['draft', 'scheduled', 'active', 'paused', 'completed', 'published'];

const electionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    type: { type: String, enum: ['general', 'regional', 'local', 'referendum', 'student'], default: 'general' },
    // Empty array => open to every constituency.
    constituencies: [{ type: Schema.Types.ObjectId, ref: 'Constituency' }],
    status: { type: String, enum: STATUSES, default: 'draft', index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    resultsPublishedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);
electionSchema.index({ status: 1, startTime: 1 });
electionSchema.path('endTime').validate(function endAfterStart(v) {
  return !this.startTime || v > this.startTime;
}, 'endTime must be after startTime');

electionSchema.statics.STATUSES = STATUSES;

module.exports = model('Election', electionSchema);
