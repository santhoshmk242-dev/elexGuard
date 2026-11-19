'use strict';
const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['voter', 'admin'], required: true, index: true },
    emailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    // Incremented on logout / password change; JWTs carrying an older value are rejected.
    tokenVersion: { type: Number, default: 0, select: false },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    role: this.role,
    emailVerified: this.emailVerified,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
  };
};

module.exports = model('User', userSchema);
