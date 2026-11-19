# Testing Report

All numbers below come from commands that were actually executed during development of this package.

## 1. Automated backend tests – `npm test` (Jest + Supertest)
**Result of the final run: 4 test suites, 83 tests, 83 passed, 0 failed (≈12 s).**

| Suite | Tests | Covers |
|---|---|---|
| `dfa.test.js` | 21 | formal definition, total δ, every valid edge, 55 rejected pairs, no skipping, no second vote, dead-state absorption, δ\*, language acceptance |
| `auth.test.js` | 20 | registration, validation, duplicate email/voter ID, bcrypt + hashed OTP storage, OTP verify/expiry/attempt limit/resend cooldown/reuse, honest email-failure handling, login, lockout, enumeration resistance, JWT tampering, RBAC (voter ↔ admin), logout revocation, NoSQL-operator injection, XSS stripping, security headers & CORS, password reset flow |
| `elections.test.js` | 16 | election create/edit/delete rules, full lifecycle *Draft→Scheduled→Active→Paused→Active→Completed→Published* with illegal jumps rejected, duration management, search/filter/sort/pagination, candidate CRUD, photo upload (real file-type + size checks), locking after start, constituency CRUD, voter approve/reject/search, dashboard stats, audit-log filtering & date range, security events, public data does not leak drafts/tallies |
| `voting.test.js` | 26 | DFA-gated ballot access, vote → receipt → S7, token refresh (S5 loop), unauthenticated / unapproved / rejected / wrong-constituency voters, skip-state attempts (DFA 409 + security event + audit), forged tokens, wrong-election candidates, duplicate vote, revoked approval, **12 parallel submissions → exactly 1 ballot**, parallel multi-voter voting, unique-index backstop, paused/ended/expired/not-started elections, anonymous-ballot structure, no choice in eligibility records or logs, audit scrubbing, hidden-until-published results, result calculation (counts, %, turnout, constituency stats, winner), PDF & CSV generation, CSV formula-injection defence, publication snapshot |

## 2. Test environment – read this
* The sandbox used for development could not install MongoDB/`mongod`. The integration tests were therefore run against **FerretDB 1.24 (SQLite backend)**, which speaks the MongoDB wire protocol. It is *not* MongoDB Atlas.
* FerretDB does not implement TTL indexes, so the tests set `SKIP_TTL_INDEXES=true` (TTL indexes are created normally everywhere else).
* FerretDB is a standalone server, so **multi-document transactions were not exercised**; the tests run the "atomic consume + unique `VoteLock` + compensation" code path. The transactional branch (`session.withTransaction`, used automatically on Atlas) is implemented but **has not been executed**. The concurrency guarantee that was tested (12 parallel requests → 1 ballot) relies on the atomic conditional update and the unique index, which MongoDB also provides.
* To run the tests on your PC use a local MongoDB or an Atlas **test** database: set `MONGODB_URI_TEST` (never point it at production – the tests delete all collections in that database).
* The email service is **mocked** in tests. Real Gmail delivery was **not tested**.

## 3. Frontend verification
* `npm run build` (Vite production build) succeeds.
* A scripted Chromium (Playwright) walkthrough against the real API + database confirmed: all public pages render; voter login → eligibility → ballot (S5) → review → confirm → receipt → history; a second ballot request is refused by the server; a voter is redirected from `/admin` to *Unauthorized*; admin login and all 12 admin screens load; the audit log shows `VOTE_CAST` without any candidate information; no horizontal overflow at 375 px width; the only browser-console error was the intentional HTTP 409 for the repeated ballot request.
* This browser walkthrough was a one-off script and is **not** included as an automated test suite. There are no React unit tests.

## 4. Seed / scripts
`npm run seed` (sample data, random passwords), `node server.js` startup, `/api/health`, and `createAdmin` input validation were executed successfully.

## 5. Not tested / unverified
* Real SMTP/Gmail delivery · MongoDB Atlas · MongoDB transactions · Render/Vercel deployment · Windows/PowerShell execution (commands are cross-platform Node/npm; the work was done on Linux) · load testing · accessibility audit (semantic HTML, labels, keyboard-reachable dialogs were used, but no WCAG audit was run) · independent security review / penetration test.
