'use strict';
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const { cleanNoSql, cleanXss } = require('../utils/sanitize');
const { securityEvent } = require('../services/security/auditService');

const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: { 'default-src': ["'self'"], 'img-src': ["'self'", 'data:'], 'frame-ancestors': ["'none'"] },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // candidate photos are fetched cross-origin in dev
  hsts: config.isProd ? { maxAge: 63072000, includeSubDomains: true, preload: true } : false,
  referrerPolicy: { policy: 'no-referrer' },
});

const corsMiddleware = cors({
  origin(origin, cb) {
    // Non-browser clients (curl, server-to-server, same-origin proxies) send no Origin header.
    if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
    return cb(null, false); // not allowed: no CORS headers are emitted, browser blocks the response
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
});

/** Strips MongoDB operators ($…, a.b) and HTML tags from request input. */
function sanitizeInput(req, _res, next) {
  const before = JSON.stringify(req.body || {}) + JSON.stringify(req.query || {});
  if (req.body) req.body = cleanXss(cleanNoSql(req.body));
  if (req.query) {
    const q = cleanXss(cleanNoSql(req.query));
    Object.keys(req.query).forEach((k) => delete req.query[k]);
    Object.assign(req.query, q);
  }
  if (req.params) req.params = cleanNoSql(req.params);
  const hadOperators = /"\$[a-zA-Z]+"/.test(before);
  if (hadOperators) {
    securityEvent(req, 'SUSPICIOUS_INPUT', { severity: 'medium', details: 'MongoDB operator keys were stripped from input.' });
  }
  next();
}

function limiter({ windowMs, max, message, type = 'RATE_LIMIT_EXCEEDED' }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => config.security.rateLimitDisabled,
    handler: (req, res) => {
      securityEvent(req, type, { severity: 'medium', details: `Rate limit exceeded on ${req.method} ${req.originalUrl.split('?')[0]}` });
      res.status(429).json({ success: false, code: 'RATE_LIMITED', message });
    },
  });
}

const apiLimiter = limiter({ windowMs: 15 * 60 * 1000, max: 600, message: 'Too many requests. Please slow down and try again later.' });
const authLimiter = limiter({ windowMs: 15 * 60 * 1000, max: 30, message: 'Too many authentication attempts. Please try again in a few minutes.' });
const otpLimiter = limiter({ windowMs: 15 * 60 * 1000, max: 15, message: 'Too many verification attempts. Please try again later.' });
const voteLimiter = limiter({ windowMs: 5 * 60 * 1000, max: 30, message: 'Too many voting requests. Please wait a moment.' });

module.exports = { helmetMiddleware, corsMiddleware, sanitizeInput, apiLimiter, authLimiter, otpLimiter, voteLimiter };
