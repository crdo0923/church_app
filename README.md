# Church Leadership LMS — Engineering Command Center

Internal engineering roadmap and project-tracking platform for building the Church Leadership LMS.
This repo is **NOT the LMS itself**. It is the team's source of truth for architecture, roadmap,
tasks, dependencies, risks, decisions, environments, deployments, team, and audit.

## Stack (pinned baseline)

- Next.js **16.3.6** (App Router, RSC-first) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui + Lucide React
- Supabase (PostgreSQL infrastructure + Auth + Storage)
- Drizzle ORM (typed schema, migrations, app DB access) + Zod (validation)
- Vitest + Testing Library + Playwright
- GitHub Actions (CI) → Vercel (web) + Supabase (data/auth/storage)
- Sentry + Vercel Observability

## Responsibility split

| Layer | Owner | Notes |
|---|---|---|
| Typed schema / migrations / app queries | Drizzle ORM | `db/` — single place for SQL shape |
| Postgres hosting / Auth / Storage infra | Supabase | No direct PG on Vercel, no local-FS uploads |
| Authorization boundary | PostgreSQL RLS | Workspace isolation enforced in DB, not just UI |
| Validation | Zod | Every mutation validated server-side |

Modular monolith. No microservices, K8s, ECS, Redis, brokers, or separate backend
services unless a real requirement is demonstrated later.

## Quickstart

```bash
npm install
cp .env.example .env.local   # fill Supabase keys
npm run db:generate && npm run db:migrate && npm run db:seed
npm run dev                  # http://localhost:3000
```

| Script | Purpose |
|---|---|
| `npm run dev` | Local dev |
| `npm run lint` / `npm run typecheck` | Static gates |
| `npm run test` / `npm run test:e2e` | Vitest / Playwright |
| `npm run build` | Production build (must pass before merge) |
| `npm run db:*` | Drizzle generate / migrate / seed / studio |

## Environments

`LOCAL → DEVELOPMENT → PREVIEW (per-PR) → STAGING → PRODUCTION`.
See `docs/environments.md` and `docs/deployment.md`. `NEXT_PUBLIC_*` only for safe
client-exposed values. Service-role key is server-only, never committed.

## MVP scope

Auth, RBAC (8 roles), Dashboard, Roadmap (10 phases), Milestones, Tasks,
Dependencies, Architecture explorer, Tech Stack, Team, Activity, Audit Logs, Settings,
RLS everywhere, responsive + a11y, Vercel deploy.

Post-MVP: risks UI polish, ADR workflow polish, notifications fan-out (email/Slack),
GitHub sync, advanced analytics, deployment health.

## Docs

- `docs/architecture.md` — system + folder structure
- `docs/database.md` — schema, indexes, RLS, seed
- `docs/authentication.md` + `docs/authorization.md` — authN / authZ + RBAC matrix
- `docs/deployment.md` + `docs/environments.md`
- `docs/integrations.md` — 7 providers as config records first
- `docs/security.md` + `docs/testing.md` + `docs/roadmap.md`
- `ARCHITECTURE_DECISIONS.md` — ADR-001…007

## Acceptance (Phase N gate)

Login/logout, protected routes, role permissions, RLS active, dashboard/roadmap/phases/
tasks/assign/status/milestones/dependencies/architecture/stack/team/activity/audit all
working, mobile + desktop layouts, loading/empty/error/401/403/404 states, migrations +
env documented, prod build + Vercel + Supabase verified, zero secrets committed.
