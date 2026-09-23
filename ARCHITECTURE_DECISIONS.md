# Architecture Decision Records

## ADR-001 — PostgreSQL (Supabase) as system of record
- Status: Accepted · Date: 2026-09-23
- Context: LMS roadmap data is relational (phases→milestones→tasks→deps), needs transactions, reporting, RLS.
- Decision: Supabase-hosted PostgreSQL; Drizzle as typed access; RLS as authZ boundary.
- Consequences: strong consistency + workspace isolation in DB; must manage migrations + PITR drills.
- Alternatives: Firebase/Firestore (rejected: weak relational/RDBMS reporting), PlanetScale/MySQL (rejected: team already on Supabase Auth/Storage).

## ADR-002 — Modular monolith first (Next.js 16 on Vercel)
- Status: Accepted · Date: 2026-09-23
- Context: single team, low ops budget, need fast iteration with future scale seams.
- Decision: Next.js App Router monolith (RSC + actions + route handlers) on Vercel; no microservices/K8s/ECS/brokers now.
- Consequences: simple deploys, colocated UI+API; must keep `server/` boundaries clean for later extraction.
- Alternatives: separate Express/Fastify backend (rejected: doubles deploys/auth surface), microservices (rejected: premature).

## ADR-003 — Drizzle ORM for schema/migrations/access, Supabase for infra
- Status: Accepted · Date: 2026-09-23
- Context: need typed SQL control + portability without giving up Supabase Auth/Storage.
- Decision: Drizzle = schema/migrations/queries; Supabase = PG hosting/Auth/Storage; direct `supabase-js` only where Drizzle adds no value (auth helpers, storage).
- Consequences: one schema source (`db/schema`); team learns Drizzle-kit flow.
- Alternatives: Prisma (rejected: heavier engine, worse SQL control), raw supabase-js everywhere (rejected: untyped joins/complex reporting suffer).

## ADR-004 — shadcn/ui + Tailwind v4 + Lucide, no UI kit lock-in
- Status: Accepted · Date: 2026-09-23
- Context: enterprise dense UI, ownable components, a11y baseline.
- Decision: shadcn/ui (Base-UI compatible) copied into repo; Tailwind v4 `@theme` tokens; Lucide icons only.
- Consequences: full component ownership; must maintain copied components.
- Alternatives: MUI/Chakra (rejected: heavy opinionated runtime + bundle).

## ADR-005 — React Flow only for graphs, Recharts only where charts add value
- Status: Accepted · Date: 2026-09-23
- Context: dependency bloat risk; graphs needed for architecture + dependencies only.
- Decision: lazy-load both; list-mode fallback on mobile; every chart must justify itself.
- Alternatives: D3 custom (rejected: maintenance cost), Mermaid static (kept for docs only).

## ADR-006 — Zod on every mutation, RLS tested per role
- Status: Accepted · Date: 2026-09-23
- Context: internal tool with 8 roles; frontend hiding is not security.
- Decision: Zod parse server-side + `requirePermission` + RLS policies; policy tests in CI.
- Alternatives: client-only checks (rejected outright).

## ADR-007 — Deploy web on Vercel at roadmapchurch.crdo.site, data on Supabase
- Status: Accepted · Date: 2026-09-23
- Context: team already runs `events/docs/cine.crdo.site` on Vercel; repo `crdo0923/church_app` (empty, created 2026-09-23).
- Decision: Vercel project `roadmapchurch` + `CNAME roadmapchurch → cname.vercel-dns.com`; Supabase for PG/Auth/Storage; GitHub Actions required checks.
- Consequences: DNS change needed at third-party registrar; instant rollback via Vercel.
- Alternatives: self-hosted VPS (rejected: ops cost), Cloudflare Pages (rejected: team standard is Vercel).
