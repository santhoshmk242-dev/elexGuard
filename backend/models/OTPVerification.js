'use strict';
const { Schema, model } = require('mongoose');

const otpSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    purpose: { type: String, enum: ['REGISTER'], default: 'REGISTER' },
    codeHash: { type: String, required: true }, // HMAC-SHA256 – the OTP itself is never stored
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumed: { type: Boolean, default: false },
    lastSentAt: { type: Date, required: true },
  },
  { timestamps: true }
);
// TTL cleanup one hour after expiry (skipped only when the test database engine lacks TTL support).
if (process.env.SKIP_TTL_INDEXES !== 'true') otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = model('OTPVerification', otpSchema);
