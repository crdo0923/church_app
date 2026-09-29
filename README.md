# Church Leadership LMS — Project Roadmap Tracker

A **human-maintained project roadmap** for planning and tracking the Church
Leadership LMS build. It is NOT the LMS, stores NO LMS operational data, and
connects to NO external system for progress. People update; the tracker records.

## Stack

- Next.js **16.3.6** + React 19 + TypeScript + Tailwind v4
- Embedded **SQLite** via `node:sqlite` (team-only accounts + roadmap data, zero new deps)
- `scrypt` password hashing, httpOnly session cookies, server-side role checks
- Zod validation on every mutation, append-only audit log
- Vitest + Playwright, GitHub Actions → Vercel (`roadmapchurch.crdo.site`)

## Quickstart

```bash
npm install
cp .env.example .env.local   # set SUPER_ADMIN_BOOTSTRAP_PASSWORD
npm run dev                  # http://localhost:3000
```

Open `/login` → create the Super Admin with the bootstrap password → invite the team.

| Script | Purpose |
|---|---|
| `npm run lint` / `npm run typecheck` | Static gates |
| `npm run test` / `npm run test:e2e` | Vitest / Playwright (SQLite at /tmp/opencode/e2e-tracker.db) |
| `npm run build` | Production build (must pass before merge) |
| `npx tsx scripts/e2e-bootstrap.ts` | Seed + admin helper for scripts (never a route) |

## Product model (§1–§20)

PROJECT → PHASE → MILESTONE → TASK → checklist / acceptance criteria, plus
deliverables, dependencies, blockers, risks, evidence, notes, activity, and
completion records. Progress percentages INFORM; nothing auto-completes.
Completion needs required criteria + evidence + an explicit human review
(override allowed with a recorded reason, always audited). Completed items can
be reopened with a reason.

Project planning status vocabulary: PLANNING · ON TRACK · AT RISK · BLOCKED ·
ON HOLD · COMPLETED (planning only — never "system health").

## Roles (§27–§32)

SUPER_ADMIN (tracker accounts + settings + all data + audit) · ADMIN (roadmap +
users when permitted) · EDITOR (roadmap content) · VIEWER (read-only).
Statuses: ACTIVE · SUSPENDED · INVITED · DISABLED. Disabled accounts cannot sign in.
Enforcement is server-side (route guards + API checks); hidden buttons are UX only.

## Super Admin (§21–§26, §49–§50)

Entry: `/admin` (Super Admin only). Bootstrap via `SUPER_ADMIN_BOOTSTRAP_PASSWORD`
(server env, never committed, never `NEXT_PUBLIC_`, never rendered). First setup
creates the Super Admin; the bootstrap value is temporary — set a real password
at setup. Invites are token links (`/login?invite=…`, 7-day expiry); users choose
their own passwords, which no admin can see.

## Routes

- `/login` (setup / sign-in / accept invite), `/app/overview` (+ `/update`),
  `/app/roadmap` (+ `/[number]`), `/app/milestones/[id]`, `/app/tasks/[id]`,
  `/app/tasks/new`, `/app/activity`, `/app/team`, `/app/documentation`,
  `/app/architecture` (planned), `/app/frontend` (technology), `/app/integrations`
  (planned), `/app/security`, `/app/devops` (tracker deploy), `/app/testing`
- `/admin`, `/admin/users`, `/admin/audit`, `/admin/settings` (Super Admin only)

## Data & deploy notes

- SQLite file: `TRACKER_DB_PATH` (default `.data/tracker.db`, gitignored). It
  persists on the team host; on Vercel serverless it is ephemeral — run the seed
  check from Admin → Tracker Settings after deploy, or set `TRACKER_SEED_ON_BOOT`.
- Reads always fall back to the bundled seed snapshot (`data/tracker-seed.ts`),
  so the app never crashes without a DB; writes need a writable file.
- Seed is idempotent (104 rows: 10 phases, milestones, tasks, deliverables,
  criteria) and never overwrites human updates.
- Tracker accounts are independent from any LMS accounts — stated in UI, docs,
  and audit.

## Docs

`docs/` holds the tracker model, database, auth, deployment, and testing notes
(plain language first). `ARCHITECTURE_DECISIONS.md` records the SQLite call and
the no-auto-complete rule.
