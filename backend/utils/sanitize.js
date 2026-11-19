'use strict';
// Input sanitisation: NoSQL-operator stripping and HTML tag stripping.

const SKIP_STRIP_KEYS = new Set(['password', 'newPassword', 'currentPassword', 'token', 'otp', 'ballotToken']);

function stripTags(s) {
  return s.replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
}

function cleanNoSql(value) {
  if (Array.isArray(value)) return value.map(cleanNoSql);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) continue; // drop operator / path-injection keys
      out[k] = cleanNoSql(v);
    }
    return out;
  }
  return value;
}

function cleanXss(value, key) {
  if (typeof value === 'string') return SKIP_STRIP_KEYS.has(key) ? value : stripTags(value).replace(/\u0000/g, '');
  if (Array.isArray(value)) return value.map((v) => cleanXss(v, key));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = cleanXss(v, k);
    return out;
  }
  return value;
}

module.exports = { cleanNoSql, cleanXss, stripTags };
