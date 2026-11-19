# ElexGuard – Project Overview

**ElexGuard – Secure Online Voting and Election Management System Using Deterministic Finite Automata (DFA).**
*Secure Elections. Trusted Democracy.* – an educational prototype; **not** certified for real elections.

| Subject | Demonstrated by |
|---|---|
| FSWD | React/Vite/Tailwind SPA, Express REST API, MongoDB/Mongoose, JWT auth, email OTP, tests, CI-ready deployment |
| FLAT / DFA | `backend/services/dfa/*`, `docs/dfa-documentation.md`, live diagram & table in the UI |
| CN | `docs/cn-documentation.md`, CORS, rate limiting, security headers, HTTPS deployment |

Roles: **Public** (portal, results), **Voter** (register → OTP → approval → ballot → receipt), **Administrator**
(elections, candidates, constituencies, voters, results, PDF/CSV reports, audit & security monitoring).

Implemented feature checklist: see the README.
