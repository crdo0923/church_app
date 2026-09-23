# Architecture — Engineering Command Center (modular monolith)

## 1. Context

Greenfield build. Empty repo, no migration. Target is an authenticated internal platform
tracking the construction of the Church Leadership LMS. Conceptual source of truth is the
provided LMS architecture image (users/access, core LMS modules, integration/automation
layer, data/infra, business flow, security) — interpreted as **roadmap content**, never
reproduced as a static screenshot.

Non-goals for MVP: microservices, K8s/ECS, self-hosted PG, Redis/brokers, live
third-party sync. Integrations exist as documented configuration/health records first.

## 2. Runtime topology

```
Developer → GitHub → GitHub Actions (lint/typecheck/unit/build/e2e/security)
  → Vercel Preview (per-PR) → QA on Staging → Promote to Production
Vercel: Next.js 16 App Router (RSC, Route Handlers, Server Actions)
Supabase: PostgreSQL (RLS) + Auth (JWT) + Storage (private buckets)
Observability: Sentry + Vercel Observability + structured logs
Optional later: Cloudflare DNS/WAF/CDN; AWS (RDS/S3/ElastiCache/SQS/ECS) behind seams
```

Constraints: no PG inside Vercel, no uploads to app filesystem, no secrets in client bundle.

## 3. Logical layers (request path)

```
Browser (Server Components default, minimal "use client")
  → App Router routes (/app/*, gated layout)
  → Server Actions / Route Handlers (thin, authZ + Zod first)
  → server/services (business logic: progress calc, transitions, search)
  → server/queries via Drizzle (typed SQL, RLS-respecting client)
  → Supabase PostgreSQL (RLS policies = authorization boundary)
```

Rules:
- No DB calls in React components. Components call actions/queries only.
- Every mutation: `getSession → getMembership → requirePermission → Zod parse → transact → audit insert`.
- Every read: session + membership scoped; VIEWER gets SELECT only via RLS.
- Progress is **derived** (`done/total`, weighted for project), stored only as cache + optional explicit override flag.

## 4. Folder structure (authoritative)

```
/app
  /(auth)/login/page.tsx, /forgot-password/page.tsx, /auth/callback/route.ts
  /app/layout.tsx                      # session + membership gate (server)
  /app/overview, /architecture (+/[componentId]), /roadmap (+/[phaseId]),
  /app/milestones/[milestoneId], /app/tasks/[taskId],
  /app/frontend, /backend, /data, /integrations, /security, /devops,
  /app/testing, /documentation (+/[documentId]), /decisions/[decisionId],
  /app/risks/[riskId], /app/team, /app/activity, /app/settings
  /api/{search,notifications,webhooks/github}/route.ts   # thin handlers
/components
  /ui/*                                # shadcn/ui (Base-UI compatible)
  /app/*                               # AppShell, Sidebar, Topbar, CommandSearch,
                                       # EnvironmentSwitcher, UserMenu, KpiCard,
                                       # RoadmapTimeline, PhaseCard, MilestoneCard,
                                       # TaskTable, TaskDrawer, DependencyGraph,
                                       # ArchitectureLayer, TechnologyCard, RiskCard,
                                       # DecisionCard, DeploymentStatus,
                                       # ActivityTimeline, NotificationCenter,
                                       # TeamMemberCard, AuditTable, states
/features/{roadmap,tasks,milestones,architecture,risks,decisions,team,activity,deployments,docs,search,notifications}
/server/{actions,queries,services,auth/guards.ts,validations/*.ts}
/db/{schema/*.ts, migrations/, seed.ts, rls.sql}
/lib/{supabase/{client,server,admin}, utils, constants, env.ts}
/types, /hooks, /services (external provider stubs: ghl, google, m365, email, sms, payments, video)
/docs/*.md, /ARCHITECTURE_DECISIONS.md, /.env.example
/e2e, /__tests__, /.github/workflows/ci.yml
```

## 5. Route map + protection

Public: `/login`, `/forgot-password`, `/auth/callback`. Everything under `/app/*` runs in
the authenticated layout: `supabase.auth.getUser()` → profile → workspace membership →
role check. Unauthorized → `/login`; forbidden role → `403`; missing entity → `404`.
API routes repeat the same guard (never trust the client).

## 6. Component map (all backed by real state)

Shell: AppShell, Sidebar (14 nav items w/ Lucide icons), Topbar (env switcher, CMD+K,
notifications, profile), CommandSearch, EnvironmentSwitcher, UserMenu.
Delivery: KpiCard, ProgressCard, RoadmapTimeline, PhaseCard, MilestoneCard, TaskTable,
TaskDrawer/TaskDetail, DependencyGraph (React Flow, lazy + list-mode fallback).
Knowledge: ArchitectureLayer/Node, TechnologyCard, RiskCard, DecisionCard,
DeploymentStatus, ActivityTimeline, NotificationCenter, TeamMemberCard, AuditTable.
States: EmptyState, ErrorState, Skeleton variants for every page.

## 7. Design tokens (Tailwind v4 `@theme`)

`background, foreground, muted, border, primary (deep navy/blue), secondary,
success, warning, danger, info` + restrained purple accent for arch/data edges.
Spacing scale, `--radius` ≈ 8px (minimal), `--shadow` subtle, type scale
Display/Page/Section/Card/Body/Caption/Metadata, motion 120–200ms + `prefers-reduced-motion`.
Dense enterprise layout: left nav / center roadmap / right arch+deploy+deps / top env+search+account.

## 8. Verification per phase (mandatory)

After every phase: `lint → typecheck → tests → prod build → visual inspect →
responsive (390/768/1280, no h-scroll) → authZ test → RLS isolation test → docs update`.
