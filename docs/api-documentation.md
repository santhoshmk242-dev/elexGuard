# REST API Reference

Base URL: `http://localhost:5000/api` (dev) · `https://<render-app>.onrender.com/api` (prod).
Responses: `{ success, message?, data?, meta? }`; errors: `{ success:false, code, message, details? }`.
Authenticated routes need `Authorization: Bearer <token>`.

## Health & public (no auth)
| Method & path | Description |
|---|---|
| GET `/health` | liveness + DB status |
| GET `/public/stats` | counts for homepage |
| GET `/public/elections?group=active|upcoming|completed&q=&page=&limit=&sort=` | published-visible elections (drafts hidden) |
| GET `/public/elections/:id` | details, candidates, participation counters (no tallies) |
| GET `/public/candidates?q=&election=` · `/public/candidates/:id` | candidate directory / profile |
| GET `/candidates/:id/photo` | candidate photograph |
| GET `/public/constituencies` · `/public/notices` | reference data |
| GET `/public/results` · `/public/results/:id` | **only published** results |
| GET `/public/dfa` | live DFA definition + transition table |
| POST `/public/contact` | contact form |

## Authentication
| Method & path | Description |
|---|---|
| POST `/auth/register` | register voter, emails OTP |
| POST `/auth/verify-otp` · `/auth/resend-otp` | verify email / resend (60 s cooldown) |
| POST `/auth/login` · `/auth/admin/login` | voter / admin login → JWT |
| POST `/auth/forgot-password` · `/auth/reset-password` | reset flow |
| GET/PUT `/auth/me` · PUT `/auth/change-password` · POST `/auth/logout` | profile & session |

## Voter (role `voter`)
| Method & path | Description |
|---|---|
| GET `/voter/dashboard` | status + counts + active/upcoming elections |
| GET `/voter/elections` · `/voter/elections/:id` | elections for the voter's constituency |
| GET `/voter/elections/:id/eligibility` | read-only eligibility check |
| POST `/voter/elections/:id/ballot-access` | DFA → S5, returns one-time `ballotToken` + candidates |
| POST `/voter/elections/:id/vote` `{candidateId, ballotToken}` | atomic vote → receipt |
| GET `/voter/candidates/:id` · `/voter/history` | candidate profile, voting history |

## Admin (role `admin`)
| Method & path | Description |
|---|---|
| GET `/admin/dashboard` | statistics |
| GET/POST `/admin/elections` · GET/PUT/DELETE `/admin/elections/:id` | CRUD (edit: draft/scheduled; delete: draft) |
| POST `/admin/elections/:id/{schedule,start,pause,resume,end,publish}` | lifecycle |
| PATCH `/admin/elections/:id/duration` | change closing time |
| GET `/admin/elections/:id/results` | turnout always; tallies only after close |
| GET `/admin/elections/:id/report` · `report.csv` · `report.pdf` | reports (after close) |
| GET/POST/PUT/DELETE `/admin/candidates[/:id]` | multipart with optional `photo` |
| GET/POST/PUT/DELETE `/admin/constituencies[/:id]` | constituencies |
| GET `/admin/voters` (`q,status,constituency,emailVerified`) · GET `/admin/voters/:id` | search/filter |
| POST `/admin/voters/:id/approve` · `/reject {reason}` | verification |
| GET/POST/DELETE `/admin/notices` · GET `/admin/messages` · POST `/admin/messages/:id/handled` | notices & inbox |
| GET `/admin/audit-logs` · `/admin/security-events` | `q, action/type, severity, role, from, to, page, sort` |

Common error codes: `VALIDATION_ERROR 400`, `UNAUTHENTICATED/INVALID_TOKEN 401`, `FORBIDDEN 403`, `NOT_ELIGIBLE 403`,
`DFA_INVALID_TRANSITION 409`, `ALREADY_VOTED 409`, `INVALID_BALLOT_TOKEN 403`, `ELECTION_LOCKED 409`, `RATE_LIMITED 429`.
