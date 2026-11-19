'use strict';
const { Schema, model } = require('mongoose');

const TYPES = [
  'FAILED_LOGIN', 'ACCOUNT_LOCKED', 'INVALID_DFA_TRANSITION', 'DUPLICATE_VOTE_ATTEMPT',
  'UNAUTHORIZED_ACCESS', 'FORBIDDEN_ACCESS', 'OTP_FAILED', 'OTP_LOCKED', 'INVALID_BALLOT_TOKEN',
  'RATE_LIMIT_EXCEEDED', 'SUSPICIOUS_INPUT', 'PASSWORD_RESET_FAILED',
];

const securityEventSchema = new Schema(
  {
    type: { type: String, enum: TYPES, required: true, index: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, default: '' },
    ip: { type: String, default: '' },
    path: { type: String, default: '' },
    details: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
securityEventSchema.index({ createdAt: -1 });
securityEventSchema.statics.TYPES = TYPES;

module.exports = model('SecurityEvent', securityEventSchema);
