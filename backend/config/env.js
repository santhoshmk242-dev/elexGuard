
'use strict';
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

function required(name, fallbackForDevOnly) {
  const v = process.env[name];

  if (v && v.trim()) return v.trim();

  if (!isProd && fallbackForDevOnly !== undefined) {
    return fallbackForDevOnly;
  }

  throw new Error(
    `Missing required environment variable: ${name}. Copy .env.example to backend/.env and fill it in.`
  );
}

const config = {
  env: process.env.NODE_ENV || 'development',
  isProd,
  isTest,

  port: parseInt(process.env.PORT || '5000', 10),

  mongoUri: required(
    'MONGODB_URI',
    'mongodb://127.0.0.1:27017/elexguard'
  ),

  jwtSecret: required(
    'JWT_SECRET',
    isTest ? 'test-only-jwt-secret-change-me-0123456789' : undefined
  ),

  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',

  otpHashSecret: required(
    'OTP_HASH_SECRET',
    isTest ? 'test-only-otp-secret-0123456789' : undefined
  ),

  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173')
    .replace(/\/$/, ''),

  corsOrigins: (
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_URL ||
    'http://localhost:5173'
  )
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean),

  trustProxy: process.env.TRUST_PROXY || (isProd ? '1' : 'false'),

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: (process.env.SMTP_SECURE || 'true') === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || '',
  },

  otp: {
    ttlMinutes: parseInt(process.env.OTP_TTL_MINUTES || '10', 10),
    resendCooldownSeconds: parseInt(
      process.env.OTP_RESEND_COOLDOWN_SECONDS || '60',
      10
    ),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),

    // Local development: print OTP in backend terminal.
    consoleOtp: !isProd && process.env.DEV_OTP_CONSOLE === 'true',
  },

  security: {
    maxFailedLogins: parseInt(process.env.MAX_FAILED_LOGINS || '5', 10),
    lockMinutes: parseInt(process.env.LOCK_MINUTES || '15', 10),
    ballotTokenTtlMinutes: parseInt(
      process.env.BALLOT_TOKEN_TTL_MINUTES || '15',
      10
    ),
    rateLimitDisabled:
      isTest || process.env.RATE_LIMIT_DISABLED === 'true',
  },
};

if (isProd && config.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production.');
}

if (isProd && config.otpHashSecret.length < 32) {
  throw new Error('OTP_HASH_SECRET must be at least 32 characters in production.');
}

module.exports = config;
