'use strict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const config = require('../config/env');
const { User, Voter, Administrator, Constituency, OTPVerification, PasswordReset } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { hmac, randomOtp, safeEqualHex, randomToken, sha256 } = require('../utils/crypto');
const { signToken } = require('../middleware/auth');
const { audit, securityEvent } = require('../services/security/auditService');
const email = require('../services/email/emailService');

const BCRYPT_ROUNDS = 12;
// Pre-computed hash so login timing is similar whether or not the account exists.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

async function issueOtp(user) {
  const now = new Date();
  const last = await OTPVerification.findOne({ user: user._id, purpose: 'REGISTER' }).sort({ createdAt: -1 });
  if (last) {
    const waitMs = last.lastSentAt.getTime() + config.otp.resendCooldownSeconds * 1000 - now.getTime();
    if (waitMs > 0) {
      throw new AppError(`Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting another code.`, 429, 'OTP_COOLDOWN', {
        retryAfterSeconds: Math.ceil(waitMs / 1000),
      });
    }
  }
  const code = randomOtp();
  // Invalidate every earlier code, then store only a keyed hash of the new one.
  await OTPVerification.updateMany({ user: user._id, consumed: false }, { $set: { consumed: true } });
  const record = await OTPVerification.create({
    user: user._id,
    codeHash: hmac(config.otpHashSecret, `${user._id}:${code}`),
    expiresAt: new Date(now.getTime() + config.otp.ttlMinutes * 60 * 1000),
    lastSentAt: now,
  });
  try {
    await email.sendOtpEmail(user.email, user.fullName, code);
  } catch (err) {
    // Do not leave a usable code behind if delivery failed, and release the cooldown.
    await OTPVerification.deleteOne({ _id: record._id });
    throw err;
  }
}

const register = asyncHandler(async (req, res) => {
  const { fullName, email: mail, password, phone, voterIdNumber, dateOfBirth, constituency, address } = req.body;

  const cons = await Constituency.findById(constituency);
  if (!cons) throw new AppError('Selected constituency does not exist.', 400, 'VALIDATION_ERROR', { fields: { constituency: 'Select a valid constituency' } });

  const existing = await User.findOne({ email: mail });
  if (existing) {
    throw new AppError(
      existing.emailVerified
        ? 'An account with this email already exists. Please log in.'
        : 'This email is registered but not verified yet. Go to the verification page and request a new code.',
      409, existing.emailVerified ? 'EMAIL_EXISTS' : 'EMAIL_EXISTS_UNVERIFIED'
    );
  }
  if (await Voter.findOne({ voterIdNumber })) {
    throw new AppError('This Voter ID is already registered.', 409, 'VOTER_ID_EXISTS', { fields: { voterIdNumber: 'Already registered' } });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ fullName, email: mail, phone: phone || '', passwordHash, role: 'voter' });
  try {
    await Voter.create({ user: user._id, constituency: cons._id, voterIdNumber, dateOfBirth, address });
  } catch (err) {
    await User.deleteOne({ _id: user._id });
    throw err; // duplicate Voter ID race etc.
  }
  await audit(req, 'REGISTER', { actor: user, targetType: 'User', targetId: user._id, description: 'New voter registered.' });

  try {
    await issueOtp(user);
  } catch (err) {
    if (err instanceof AppError && ['EMAIL_DELIVERY_FAILED', 'EMAIL_NOT_CONFIGURED'].includes(err.code)) {
      return res.status(err.status).json({
        success: false, code: err.code,
        message: `${err.message} Your account was created – use "Resend code" on the verification page once email delivery works.`,
        data: { email: user.email, accountCreated: true },
      });
    }
    throw err;
  }
  return res.status(201).json({
    success: true,
    message: `Registration successful. A 6-digit verification code was sent to ${user.email}.`,
    data: { email: user.email, otpExpiresInMinutes: config.otp.ttlMinutes },
  });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email: mail, otp } = req.body;
  const user = await User.findOne({ email: mail });
  const generic = new AppError('Invalid or expired verification code.', 400, 'OTP_INVALID');
  if (!user) throw generic;
  if (user.emailVerified) throw new AppError('Email is already verified. Please log in.', 409, 'ALREADY_VERIFIED');

  const record = await OTPVerification.findOne({ user: user._id, consumed: false }).sort({ createdAt: -1 });
  if (!record || record.expiresAt < new Date()) throw new AppError('Verification code expired. Please request a new one.', 400, 'OTP_EXPIRED');
  if (record.attempts >= config.otp.maxAttempts) {
    await securityEvent(req, 'OTP_LOCKED', { severity: 'medium', user, details: 'OTP attempt limit reached.' });
    throw new AppError('Too many incorrect attempts. Please request a new code.', 429, 'OTP_LOCKED');
  }

  const ok = safeEqualHex(record.codeHash, hmac(config.otpHashSecret, `${user._id}:${otp}`));
  if (!ok) {
    // Atomic increment so parallel guesses cannot exceed the limit.
    const upd = await OTPVerification.findOneAndUpdate({ _id: record._id }, { $inc: { attempts: 1 } }, { new: true });
    await securityEvent(req, 'OTP_FAILED', { severity: 'low', user, details: `Incorrect OTP (attempt ${upd.attempts}/${config.otp.maxAttempts}).` });
    const left = Math.max(config.otp.maxAttempts - upd.attempts, 0);
    throw new AppError(`Incorrect code. ${left} attempt${left === 1 ? '' : 's'} remaining.`, 400, 'OTP_INVALID', { attemptsRemaining: left });
  }

  // One-time use: mark consumed only if it still is unconsumed (prevents replay).
  const used = await OTPVerification.findOneAndUpdate({ _id: record._id, consumed: false }, { $set: { consumed: true } });
  if (!used) throw generic;
  user.emailVerified = true;
  await user.save();
  await audit(req, 'OTP_VERIFIED', { actor: user, targetType: 'User', targetId: user._id, description: 'Email verified using OTP.' });
  res.json({ success: true, message: 'Email verified. Your registration is now awaiting administrator approval.' });
});

const resendOtp = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  // Same response whether or not the account exists (no user enumeration).
  if (user && !user.emailVerified) {
    await issueOtp(user);
    await audit(req, 'OTP_RESENT', { actor: user, targetType: 'User', targetId: user._id, description: 'Verification code re-sent.' });
  }
  res.json({ success: true, message: 'If the account exists and is unverified, a new code has been sent.' });
});

async function doLogin(req, res, expectedRole) {
  const { email: mail, password } = req.body;
  const user = await User.findOne({ email: mail }).select('+passwordHash +tokenVersion');
  const now = new Date();

  if (user && user.lockUntil && user.lockUntil > now) {
    await securityEvent(req, 'ACCOUNT_LOCKED', { severity: 'medium', user, details: 'Login attempt on a locked account.' });
    throw new AppError('Account temporarily locked after repeated failed logins. Try again later.', 423, 'ACCOUNT_LOCKED');
  }

  const valid = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !valid || user.role !== expectedRole || !user.isActive) {
    if (user) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const lock = attempts >= config.security.maxFailedLogins;
      await User.updateOne({ _id: user._id }, {
        $set: { failedLoginAttempts: lock ? 0 : attempts, lockUntil: lock ? new Date(Date.now() + config.security.lockMinutes * 60000) : null },
      });
      if (lock) await securityEvent(req, 'ACCOUNT_LOCKED', { severity: 'high', user, details: `Locked for ${config.security.lockMinutes} minutes after repeated failures.` });
    }
    await securityEvent(req, 'FAILED_LOGIN', { severity: 'low', user, email: mail, details: `Failed ${expectedRole} login.` });
    await audit(req, 'LOGIN_FAILED', { actor: user && user.role === expectedRole ? user : null, description: `Failed ${expectedRole} login for ${mail}.`, metadata: { email: mail } });
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.emailVerified) {
    throw new AppError('Please verify your email address before logging in.', 403, 'EMAIL_NOT_VERIFIED', { email: user.email });
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  user.lastLoginAt = now;
  await user.save();
  await audit(req, 'LOGIN_SUCCESS', { actor: user, targetType: 'User', targetId: user._id, description: `${user.role} logged in.` });

  const token = signToken(user);
  const profile = await buildProfile(user);
  res.json({ success: true, message: 'Login successful.', data: { token, user: profile } });
}

const login = asyncHandler((req, res) => doLogin(req, res, 'voter'));
const adminLogin = asyncHandler((req, res) => doLogin(req, res, 'admin'));

async function buildProfile(user) {
  const base = user.toSafeJSON();
  if (user.role === 'voter') {
    const voter = await Voter.findOne({ user: user._id }).populate('constituency', 'name code region');
    if (voter) {
      base.voter = {
        id: voter._id,
        voterIdNumber: voter.voterIdNumber,
        dateOfBirth: voter.dateOfBirth,
        address: voter.address,
        constituency: voter.constituency,
        verificationStatus: voter.verificationStatus,
        rejectionReason: voter.rejectionReason,
        reviewedAt: voter.reviewedAt,
      };
    }
  } else {
    const admin = await Administrator.findOne({ user: user._id });
    if (admin) base.admin = { designation: admin.designation, department: admin.department };
  }
  return base;
}

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: await buildProfile(req.user) } });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, address, designation } = req.body;
  if (fullName !== undefined) req.user.fullName = fullName;
  if (phone !== undefined) req.user.phone = phone;
  await req.user.save();
  if (req.user.role === 'voter' && address !== undefined) await Voter.updateOne({ user: req.user._id }, { $set: { address } });
  if (req.user.role === 'admin' && designation !== undefined) await Administrator.updateOne({ user: req.user._id }, { $set: { designation } });
  await audit(req, 'PROFILE_UPDATED', { targetType: 'User', targetId: req.user._id, description: 'Profile updated.' });
  res.json({ success: true, message: 'Profile updated.', data: { user: await buildProfile(req.user) } });
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordHash +tokenVersion');
  if (!(await bcrypt.compare(req.body.currentPassword, user.passwordHash))) {
    throw new AppError('Current password is incorrect.', 400, 'INVALID_CREDENTIALS', { fields: { currentPassword: 'Incorrect password' } });
  }
  user.passwordHash = await bcrypt.hash(req.body.newPassword, BCRYPT_ROUNDS);
  user.tokenVersion = (user.tokenVersion || 0) + 1; // revoke all existing sessions
  await user.save();
  await audit(req, 'PASSWORD_CHANGED', { targetType: 'User', targetId: user._id, description: 'Password changed.' });
  res.json({ success: true, message: 'Password changed. Please log in again.', data: { reauthenticate: true } });
});

const logout = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } }); // server-side token revocation
  await audit(req, 'LOGOUT', { targetType: 'User', targetId: req.user._id, description: 'User logged out.' });
  res.json({ success: true, message: 'Logged out.' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const generic = { success: true, message: 'If an account exists for that email, a password reset link has been sent.' };
  const user = await User.findOne({ email: req.body.email, isActive: true });
  if (!user) return res.json(generic);

  const recent = await PasswordReset.findOne({ user: user._id }).sort({ createdAt: -1 });
  if (recent && Date.now() - recent.createdAt.getTime() < 60 * 1000) return res.json(generic); // cooldown, silent

  const token = randomToken(32);
  await PasswordReset.updateMany({ user: user._id, used: false }, { $set: { used: true } });
  await PasswordReset.create({ user: user._id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 30 * 60 * 1000) });
  const link = `${config.frontendUrl}/reset-password?token=${token}`;
  try {
    await email.sendPasswordResetEmail(user.email, user.fullName, link);
    await audit(req, 'PASSWORD_RESET_REQUESTED', { actor: user, targetType: 'User', targetId: user._id, description: 'Password reset link sent.' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[auth] password reset email failed:', err.code || err.message);
  }
  return res.json(generic);
});

const resetPassword = asyncHandler(async (req, res) => {
  const record = await PasswordReset.findOne({ tokenHash: sha256(req.body.token) });
  if (!record || record.used || record.expiresAt < new Date()) {
    await securityEvent(req, 'PASSWORD_RESET_FAILED', { severity: 'medium', details: 'Invalid or expired reset token used.' });
    throw new AppError('This reset link is invalid or has expired. Please request a new one.', 400, 'RESET_TOKEN_INVALID');
  }
  const claimed = await PasswordReset.findOneAndUpdate({ _id: record._id, used: false }, { $set: { used: true } });
  if (!claimed) throw new AppError('This reset link has already been used.', 400, 'RESET_TOKEN_INVALID');
  const user = await User.findById(record.user).select('+passwordHash +tokenVersion');
  user.passwordHash = await bcrypt.hash(req.body.password, BCRYPT_ROUNDS);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();
  await audit(req, 'PASSWORD_RESET_COMPLETED', { actor: user, targetType: 'User', targetId: user._id, description: 'Password reset completed.' });
  res.json({ success: true, message: 'Password updated. You can now log in with your new password.' });
});

module.exports = {
  register, verifyOtp, resendOtp, login, adminLogin, me, updateProfile, changePassword, logout,
  forgotPassword, resetPassword, buildProfile, BCRYPT_ROUNDS,
};
