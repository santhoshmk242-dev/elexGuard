'use strict';
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('../config/env');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { securityEvent } = require('../services/security/auditService');

function signToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, tv: user.tokenVersion || 0 },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn, issuer: 'elexguard', audience: 'elexguard-web' }
  );
}

function extractToken(req) {
  const h = req.headers.authorization || '';
  const [scheme, token] = h.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

/** Verifies the JWT, loads the user, and rejects revoked (logged-out) tokens. */
const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) {
    await securityEvent(req, 'UNAUTHORIZED_ACCESS', { severity: 'low', details: 'Request without authentication token.' });
    throw new AppError('Authentication required. Please log in.', 401, 'UNAUTHENTICATED');
  }
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { issuer: 'elexguard', audience: 'elexguard-web', algorithms: ['HS256'] });
  } catch (_e) {
    await securityEvent(req, 'UNAUTHORIZED_ACCESS', { severity: 'medium', details: 'Invalid or expired token presented.' });
    throw new AppError('Your session is invalid or has expired. Please log in again.', 401, 'INVALID_TOKEN');
  }
  if (!mongoose.isValidObjectId(payload.sub)) throw new AppError('Invalid session.', 401, 'INVALID_TOKEN');
  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user || !user.isActive || (user.tokenVersion || 0) !== payload.tv) {
    await securityEvent(req, 'UNAUTHORIZED_ACCESS', { severity: 'medium', details: 'Revoked or unknown session token.' });
    throw new AppError('Your session has ended. Please log in again.', 401, 'SESSION_REVOKED');
  }
  req.user = user;
  next();
});

/** Role-based access control. */
const authorize = (...roles) => asyncHandler(async (req, _res, next) => {
  if (!req.user) throw new AppError('Authentication required.', 401, 'UNAUTHENTICATED');
  if (!roles.includes(req.user.role)) {
    await securityEvent(req, 'FORBIDDEN_ACCESS', {
      severity: 'high', user: req.user, details: `Role "${req.user.role}" attempted to access a "${roles.join('/')}" resource.`,
    });
    throw new AppError('You do not have permission to access this resource.', 403, 'FORBIDDEN');
  }
  next();
});

module.exports = { signToken, authenticate, authorize };
