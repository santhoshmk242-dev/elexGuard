# Deployment Guide (GitHub → MongoDB Atlas → Render → Vercel)

> Deployment steps below have **not** been executed by the author of this package (no access to your accounts). Follow them and
> verify with the checks in step 6.

## 1. GitHub
```powershell
cd ElexGuard
git init
git add .
git commit -m "ElexGuard initial commit"
git branch -M main
git remote add origin https://github.com/<you>/ElexGuard.git
git push -u origin main
```
`.env` files are git-ignored. Confirm `git status` shows no `.env`.

## 2. MongoDB Atlas
1. Create a free **M0** cluster at <https://cloud.mongodb.com>.
2. *Database Access* → Add user (password auth), e.g. `elexguard` with a long random password; role *Read and write to any database*.
3. *Network Access* → allow Render. On the free plan Render has no fixed IPs, so add `0.0.0.0/0` (acceptable for a student project; the DB still requires the password).
4. *Connect → Drivers* → copy the SRV string and add the database name:
   `mongodb+srv://elexguard:<password>@<cluster>.mongodb.net/elexguard?retryWrites=true&w=majority` (URL-encode special characters in the password).

Atlas is a replica set, so the vote service automatically uses **multi-document transactions**.

## 3. Render (backend)
1. *New → Blueprint* (uses `render.yaml`) **or** *New → Web Service*: root directory `backend`, build `npm install --omit=dev`, start `node server.js`, health check `/api/health`.
2. Environment variables: `NODE_ENV=production`, `TRUST_PROXY=1`, `MONGODB_URI`, `JWT_SECRET`, `OTP_HASH_SECRET` (≥32 chars each; `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`), `FRONTEND_URL=https://<your-app>.vercel.app`, `CORS_ORIGINS=https://<your-app>.vercel.app`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`.
3. Deploy, then open `https://<service>.onrender.com/api/health` – expect `"database":"connected"`.
4. Create the first admin: Render dashboard → *Shell* → `ADMIN_EMAIL=you@example.com ADMIN_NAME="Your Name" ADMIN_PASSWORD='<12+ chars>' node scripts/createAdmin.js` (shell may be unavailable on the free plan; alternative: run the same command on your PC with `MONGODB_URI` pointing at Atlas).
5. Free instances sleep after inactivity; the first request may take ~30–60 s.

## 4. Vercel (frontend)
1. *Add New Project* → import the repo → **Root Directory: `frontend`**, framework *Vite* (build `npm run build`, output `dist`).
2. Edit `frontend/vercel.json` and replace `YOUR-RENDER-SERVICE` with your Render hostname **before deploying**. The rewrite sends `/api/*` to Render (same-origin for the browser, so no CORS preflight) and everything else to `index.html` (SPA routing fallback).
3. Deploy. Your single public URL is `https://<project>.vercel.app`.
   (Alternative without the rewrite: set `VITE_API_URL=https://<render>.onrender.com/api` in Vercel and keep `CORS_ORIGINS` set to the Vercel URL.)

## 5. Production settings checklist
* `NODE_ENV=production` (hides stack traces, enables HSTS, enforces secret length).
* `CORS_ORIGINS` contains only your Vercel URL(s).
* `TRUST_PROXY=1`.
* Strong admin password (≥ 12 chars). Do **not** run `npm run seed` in production (it refuses).

## 6. Post-deploy verification
1. `/api/health` → ok/connected. 2. Open the site, register with a real mailbox you own → OTP arrives. 3. Log in as admin → approve voter.
4. Create election + 2 candidates → schedule → start → vote as the voter → end → publish → results appear publicly.
