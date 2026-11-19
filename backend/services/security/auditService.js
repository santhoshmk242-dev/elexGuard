'use strict';
const { AuditLog, SecurityEvent } = require('../../models');

// Any metadata key matching this pattern is dropped, so audit logs can never contain
// passwords, OTPs, tokens, secrets or a voter's candidate selection.
const FORBIDDEN_KEY = /(pass|otp|token|secret|hash|candidate|choice|selection|ballot|authorization|cookie)/i;

function scrub(value, depth = 0) {
  if (depth > 4 || value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => scrub(v, depth + 1));
  if (value instanceof Date) return value;
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN_KEY.test(k)) continue;
      out[k] = scrub(v, depth + 1);
    }
    return out;
  }
  if (typeof value === 'string') return value.slice(0, 300);
  return value;
}

function clientInfo(req) {
  if (!req) return { ip: '', userAgent: '' };
  return {
    ip: (req.ip || (req.socket && req.socket.remoteAddress) || '').toString().slice(0, 64),
    userAgent: String((req.headers && req.headers['user-agent']) || '').slice(0, 300),
  };
}

async function audit(req, action, { actor, targetType = '', targetId = '', description = '', metadata = {} } = {}) {
  try {
    const user = actor || (req && req.user) || null;
    await AuditLog.create({
      action,
      actor: user ? user._id || user.id : null,
      actorEmail: user ? user.email || '' : '',
      actorRole: user ? user.role : 'anonymous',
      targetType,
      targetId: targetId ? String(targetId) : '',
      description: String(description).slice(0, 500),
      metadata: scrub(metadata),
      ...clientInfo(req),
    });
  } catch (err) {
    // Auditing must never break the request path.
    // eslint-disable-next-line no-console
    console.error('[audit] failed to write audit log:', err.message);
  }
}

async function securityEvent(req, type, { severity = 'medium', user = null, email = '', details = '' } = {}) {
  try {
    await SecurityEvent.create({
      type,
      severity,
      user: user ? user._id || user.id || user : null,
      email: email || (user && user.email) || '',
      ip: clientInfo(req).ip,
      path: req ? String(req.originalUrl || '').split('?')[0].slice(0, 200) : '',
      details: String(details).slice(0, 500),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[security] failed to write security event:', err.message);
  }
}

module.exports = { audit, securityEvent, scrub, FORBIDDEN_KEY };
