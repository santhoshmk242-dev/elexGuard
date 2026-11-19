'use strict';
const crypto = require('crypto');

const sha256 = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
const hmac = (secret, v) => crypto.createHmac('sha256', secret).update(String(v)).digest('hex');
const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
const randomOtp = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

function safeEqualHex(a, b) {
  const ba = Buffer.from(String(a), 'hex');
  const bb = Buffer.from(String(b), 'hex');
  if (ba.length !== bb.length || ba.length === 0) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Human friendly, non-revealing vote receipt reference, e.g. EG-7F3A-91C2-B04D
function receiptReference() {
  const part = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `EG-${part()}-${part()}-${part()}`;
}

module.exports = { sha256, hmac, randomToken, randomOtp, safeEqualHex, receiptReference };
