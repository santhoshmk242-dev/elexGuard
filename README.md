# ElexGuard

**Secure Online Voting and Election Management System Using Deterministic Finite Automata (DFA)**
*Secure Elections. Trusted Democracy.*

> Educational prototype for FSWD, FLAT, CN and DFA. **Not certified for real elections** – see `docs/security-documentation.md` §4.

Stack: React + Vite + Tailwind + React Router + Axios + Recharts + Lucide · Node.js + Express + Mongoose · MongoDB Atlas · JWT, bcrypt, Nodemailer (Gmail), Helmet, CORS, express-rate-limit, Zod, PDFKit.

## Folder structure
```
ElexGuard/
├─ backend/   config/ controllers/ middleware/ models/ routes/ utils/ scripts/ tests/ server.js app.js
│             services/{dfa,voting,email,security}
├─ frontend/  src/{assets,components,pages,layouts,context,hooks,services,utils,styles}  vite.config.js vercel.json
├─ docs/      project-overview, system-architecture, database-design, dfa-documentation, cn-documentation,
│             security-documentation, api-documentation, testing-report, deployment-guide
├─ .env.example  render.yaml  package.json  README.md  .gitignore
```

## 1. Prerequisites
Node.js ≥ 18.17 (LTS 20/22 recommended) and npm, VS Code, a MongoDB Atlas account (or local MongoDB), a Gmail account with 2-Step Verification.

## 2. MongoDB Atlas setup (≈5 min)
1. <https://cloud.mongodb.com> → create a free **M0** cluster.
2. *Database Access* → add a user + password. 3. *Network Access* → add your current IP (or `0.0.0.0/0` for testing).
4. *Connect → Drivers* → copy the connection string and append the DB name: `mongodb+srv://USER:PASS@cluster.mongodb.net/elexguard?retryWrites=true&w=majority`.

## 3. Gmail App Password (for OTP emails)
1. Google Account → **Security** → enable **2-Step Verification**.
2. Open <https://myaccount.google.com/apppasswords> → app name `ElexGuard` → **Create**.
3. Copy the 16-character password (remove spaces) → this is `SMTP_PASS`. `SMTP_USER` is your Gmail address.
4. Never use your normal Gmail password. If the page is missing, 2-Step Verification is not on (or your Workspace admin disabled it).

## 4. Configure
```powershell
cd ElexGuard\backend
copy ..\.env.example .env
notepad .env
```
Fill in `MONGODB_URI`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, and generate the two secrets:
```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # run twice → JWT_SECRET, OTP_HASH_SECRET
```
Without SMTP credentials the API still starts, but registration returns an honest "email delivery not configured" error (the OTP is never faked).

## 5. Install & run (two terminals, Windows PowerShell)
**Terminal 1 – backend → http://localhost:5000**
```powershell
cd ElexGuard\backend
npm install
npm run dev        # or: npm start
```
**Terminal 2 – frontend → http://localhost:5173**
```powershell
cd ElexGuard\frontend
npm install
npm run dev
```
Health check: <http://localhost:5000/api/health>. The Vite dev server proxies `/api` to port 5000.

## 6. Create the first administrator (no default credentials exist)
```powershell
cd ElexGuard\backend
npm run create-admin          # prompts for email, name and a hidden password
```
Log in at <http://localhost:5173/admin/login>.

## 7. Optional: development sample data
```powershell
npm run seed                  # refuses to run in production; add  -- --reset  to wipe the DB first
```
Creates clearly labelled **DEV SAMPLE** constituencies, voters (`voterNN@sample.elexguard.test`), elections and candidates, plus an admin; random passwords are printed once. All e-mail addresses use the reserved `.test` TLD.

## 8. Tests
```powershell
cd ElexGuard\backend
# needs a MongoDB reachable at mongodb://127.0.0.1:27017 or set MONGODB_URI_TEST (a throw-away database – tests wipe it!)
npm test
```
Latest recorded run: **83/83 passed** (see `docs/testing-report.md` for environment caveats).

## 9. Feature checklist
**Public**: home, about, how it works (live DFA table/diagram), elections (search/filter/paginate), election details, candidates, candidate details, results & statistics, constituencies, notices, FAQ, contact (stored for admins), login, register, 404, unauthorized.
**Voter**: register, email OTP (resend cooldown, expiry, attempt limit), login, forgot/reset password, profile & password change, identity/approval status, eligible/upcoming/active/completed elections, candidate profiles with photos & manifestos, eligibility check, DFA-validated ballot access, selection → review → final confirmation → submit, non-revealing receipt, history, published results.
**Admin**: dashboard stats & charts; create/edit/delete-draft/schedule/start/pause/resume/end/publish elections; manage duration; constituencies; candidates (photo upload, party, manifesto); voters (search, filters, approve/reject with reason, details); results; PDF & CSV reports; audit logs and security monitoring with search/filter/date range; notices & contact inbox; profile; logout.
**Platform**: DFA engine + tests, anonymous ballots, atomic one-time authorisation, duplicate/concurrent-vote prevention, JWT + token revocation, RBAC, Helmet, CORS, rate limits, Zod validation, NoSQL/XSS defences, secure uploads, audit scrubbing, responsive UI, loading/error/empty states, deployment configs.

## 10. Deployment
See `docs/deployment-guide.md` (GitHub → Atlas → Render → Vercel). Remember to replace `YOUR-RENDER-SERVICE` in `frontend/vercel.json`.

## 11. Known limitations
* Educational prototype: no end-to-end verifiable cryptography, self-asserted identity, trust in the server operator for anonymity.
* Real Gmail delivery, Atlas, MongoDB transactions, deployment and Windows execution were **not tested** by the author (see testing report).
* Gmail SMTP is limited to ~500 messages/day; in-memory rate limiting is per instance.
