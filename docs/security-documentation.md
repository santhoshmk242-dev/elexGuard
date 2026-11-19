# Security Documentation

## 1. Threat model summary
Assets: voter identities, one-person-one-vote integrity, ballot secrecy, admin functions, credentials.
Attackers considered: anonymous internet users, malicious registered voters, a curious or compromised administrator (for ballot secrecy only), network eavesdroppers.

## 2. Controls implemented (and where)
| Area | Control | Location |
|---|---|---|
| Passwords | bcrypt (cost 12); strong password policy enforced by Zod on the server | `authController`, `validators` |
| Login | generic error message, constant-time dummy compare for unknown users, lockout after 5 failures for 15 min | `authController.doLogin` |
| Sessions | JWT HS256, issuer/audience pinned, 2 h expiry, `tokenVersion` revocation on logout/password change/reset | `middleware/auth.js` |
| RBAC | `authorize('admin' \| 'voter')` on every protected router; frontend `ProtectedRoute` is UX only | `routes/*`, `ProtectedRoute.jsx` |
| Email OTP | 6 digits from `crypto.randomInt`; stored as HMAC-SHA256; 10 min expiry; 60 s resend cooldown; max 5 attempts (atomic `$inc`); one-time use; older codes invalidated on resend; failed delivery deletes the code and returns an honest error | `authController`, `OTPVerification` |
| Password reset | 256-bit random token, only SHA-256 stored, 30 min expiry, single use, no account enumeration | `authController` |
| Input validation | Zod schemas for every body; server never trusts the client | `utils/validators.js`, `middleware/validate.js` |
| NoSQL injection | operator-key stripping (`$…`, dotted keys) on body/query/params + Zod type checks | `utils/sanitize.js`, `middleware/security.js` |
| XSS | HTML tags stripped from input; React escapes output; CSP; no `dangerouslySetInnerHTML` anywhere | `sanitize.js`, `helmet` |
| CSRF | not applicable – bearer-token auth, no auth cookies (see CN doc §4) | — |
| Rate limiting | per-IP limiters, events logged | `middleware/security.js` |
| HTTP headers / CORS | Helmet, strict origin allow-list, HSTS in production, `x-powered-by` removed | `middleware/security.js` |
| File uploads | memory storage, 1 MB limit, MIME allow-list **and** magic-byte verification, served with `nosniff`, stored in MongoDB (not on disk) | `middleware/upload.js` |
| Errors | operational errors → clear messages; unexpected errors → generic message in production, details only in server logs | `middleware/errorHandler.js` |
| CSV export | cells starting with `= + - @` are neutralised (formula injection) | `utils/csv.js` |
| Secrets | only via environment variables; startup fails in production if secrets are missing/short; `.env` is git-ignored | `config/env.js` |
| Audit | admin actions, auth events, DFA rejections, duplicate attempts; metadata scrubbed of keys matching `pass|otp|token|secret|hash|candidate|choice|selection|ballot|authorization|cookie` | `auditService.js` |

## 3. Ballot secrecy design
```
VoterEligibility  (who may vote / has voted)      AnonymousBallot (what was chosen)
 ├ election, voter                                 ├ _id = 128-bit random hex (not an ObjectId, no time component)
 ├ dfaState, hasVoted                              ├ election
 ├ authorizationHash (SHA-256 of one-time token)   ├ candidate
 ├ receiptReference (random, unrelated to ballot)  └ constituency
 └ votedAt (rounded to the hour)                   (NO voter reference, NO createdAt/updatedAt)
VoteLock (unique election+voter) – arbiter for one-vote-per-voter, stores no choice
```
Submission algorithm (`services/voting/voteService.js`):
1. Verify live facts + DFA `δ(state, SUBMIT_VOTE)`; verify candidate belongs to election.
2. **Consume** the one-time authorisation with a single `findOneAndUpdate` whose filter contains `hasVoted:false`, `dfaState:S5`, the token hash and an unexpired time → only one concurrent request can match.
3. Insert the `VoteLock` (unique index) – a second independent atomic guard.
4. Insert the anonymous ballot; set the DFA state to S7.
5. Steps 2–4 run in a **MongoDB transaction when the deployment is a replica set (Atlas)**; otherwise a compensating rollback restores the voter if the ballot insert fails.

Anonymity measures: no voter id on ballots; no timestamps; random ids; vote time stored only to the hour; the receipt is random and
not derivable from the ballot; audit logs/security events never include candidate ids (tested); admins cannot read tallies before the election closes.

## 4. Known limitations of this prototype (important for the viva)
This is an **educational prototype**, not a certified election system. A real election system would additionally require:
* **End-to-end verifiable cryptography** (e.g. blind signatures / mix-nets / homomorphic tallying, zero-knowledge proofs) so that voters can verify their ballot was counted without revealing it. Here, anonymity depends on trusting the server operator and the database not to correlate data. A database administrator who can observe live traffic or read all collections *and* server logs at the moment of voting could try to correlate (mitigated, not eliminated, by hour-rounding and random ids).
* **Strong identity proofing** (government e-ID, in-person verification). Here voter IDs are self-asserted and approved manually.
* **Coercion/vote-buying resistance** (receipt-freeness is partially met – the receipt reveals nothing – but remote voting is inherently coercible).
* Hardware-backed key management, HSMs, independent code and infrastructure audits, penetration tests, legal certification, accessibility conformance (WCAG), DDoS protection, and disaster recovery.
* The JWT is held in `sessionStorage`; a stored XSS flaw could steal it. A production system might use short-lived tokens with HttpOnly cookies + CSRF protection and device binding.
* Rate limiting is in-memory per instance; use a shared store (Redis) when scaling beyond one instance.
* Gmail SMTP is rate-limited (~500 emails/day) and unsuitable for large elections.
