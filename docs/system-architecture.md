# System Architecture

```mermaid
flowchart TB
  subgraph Browser
    UI[React + Tailwind SPA<br/>React Router · Axios · Recharts]
  end
  subgraph API[Express API]
    MW[Helmet · CORS · sanitiser · rate limit · JWT · RBAC · Zod]
    CT[Controllers]
    DFA[DFA engine + workflow service]
    VS[Vote service<br/>atomic consume · lock · anonymous ballot]
    AU[Audit / security events]
    EM[Email service - Nodemailer]
  end
  DB[(MongoDB Atlas)]
  UI -->|REST JSON over HTTPS| MW --> CT
  CT --> DFA --> VS --> DB
  CT --> AU --> DB
  CT --> EM -->|SMTP TLS| Gmail
  CT --> DB
```
Layering: `routes → middleware → controllers → services (dfa / voting / email / security) → models`.
The DFA and vote services contain no HTTP code, so they are unit-testable. `app.js` builds the Express app without listening,
which lets Supertest exercise the real stack.

Frontend structure: `layouts/` (Public, Voter, Admin shells), `pages/` (public, auth, voter, admin, shared),
`components/` (design-system UI kit, DFA diagram, results charts), `context/` (auth, toasts), `services/api.js`, `hooks/`, `utils/`.
