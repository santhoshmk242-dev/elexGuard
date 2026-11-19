'use strict';
const { Schema, model } = require('mongoose');

const noticeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    body: { type: String, trim: true, maxlength: 1000, default: '' },
    kind: { type: String, enum: ['info', 'election', 'result', 'maintenance'], default: 'info' },
    election: { type: Schema.Types.ObjectId, ref: 'Election', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);
noticeSchema.index({ createdAt: -1 });

module.exports = model('Notice', noticeSchema);
