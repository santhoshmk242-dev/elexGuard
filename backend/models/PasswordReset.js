'use strict';
const { Schema, model } = require('mongoose');

const passwordResetSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true }, // SHA-256 of the emailed token
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);
// TTL cleanup one hour after expiry (skipped only when the test database engine lacks TTL support).
if (process.env.SKIP_TTL_INDEXES !== 'true') passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = model('PasswordReset', passwordResetSchema);
