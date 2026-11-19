# Database Design (MongoDB / Mongoose)

| Collection (model) | Purpose | Key indexes / constraints |
|---|---|---|
| `User` | credentials & role (voter/admin) | unique `email`; `role` |
| `Voter` | voter profile, constituency, approval status | unique `user`, unique `voterIdNumber`; `{verificationStatus, constituency}` |
| `Administrator` | admin profile | unique `user` |
| `Constituency` | areas | unique `code` |
| `Election` | lifecycle `draft→scheduled→active⇄paused→completed→published` | `{status,startTime}`; `endTime > startTime` validator |
| `Candidate` | name, party, symbol, manifesto, photo (binary) | unique `{election,name}` |
| `VoterEligibility` | who may/has voted + DFA state + one-time authorisation hash + receipt | **unique `{election,voter}`**; `{election,hasVoted}` |
| `VoteLock` | atomic one-vote guard (no choice stored) | **unique `{election,voter}`** |
| `AnonymousBallot` | candidate choice with **no voter link** | `{election,candidate}`, `{election,constituency}` |
| `OTPVerification` | hashed email OTP, attempts, expiry | TTL index (1 h after expiry) |
| `PasswordReset` | hashed single-use token | unique `tokenHash`; TTL index |
| `AuditLog` | audit trail | `createdAt`, `action`, `actor` |
| `SecurityEvent` | security monitoring | `type`, `severity`, `createdAt` |
| `ElectionResult` | immutable snapshot at publication (unique per election) | unique `election` |
| `Notice`, `ContactMessage` | public notices, contact inbox | `createdAt` |

Design notes
* **Atomic operations**: OTP attempt counters (`$inc`), OTP/reset-token consumption, ballot-authorisation consumption (`findOneAndUpdate` with full precondition), unique indexes for duplicates.
* **Transactions**: `config/db.js` detects replica-set/sharded deployments (`hello.setName`) – Atlas always qualifies – and `voteService` then wraps consume + lock + ballot in `session.withTransaction`.
* **Validation**: Mongoose schema validators (enums, lengths, regex) in addition to Zod at the API boundary.
* **Photos** are stored as `Buffer` in MongoDB (≤ 1 MB, `select:false`) because Render's free disk is ephemeral.
