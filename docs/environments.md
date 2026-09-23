# Environments

| Env | Purpose | Data | URL pattern | Promote rule |
|---|---|---|---|---|
| LOCAL | dev machine | local Supabase / dev branch | `localhost:3000` | — |
| DEVELOPMENT | shared dev | Supabase dev project | `*.vercel.app` (branch) | push |
| PREVIEW | per-PR QA | seeded ephemeral / dev | `pr-<n>-*.vercel.app` | auto per PR |
| STAGING | release candidate | prod-like snapshot (sanitized) | `staging-*.vercel.app` or `staging.crdo.site` | manual |
| PRODUCTION | live | Supabase prod | `https://roadmapchurch.crdo.site` | manual + checks green |

Topbar `EnvironmentSwitcher` filters deployment/integration-health views; it never
switches database connections implicitly — connection comes from env vars per deployment.

## Variables per env

`.env.example` lists all keys; `.env.local` (git-ignored) for LOCAL. Vercel dashboard
holds DEVELOPMENT/PREVIEW/STAGING/PRODUCTION values. Service-role key exists only in
server runtime (Vercel env, never `NEXT_PUBLIC_*`, never committed).

## Data discipline

- Seed script idempotent (`on conflict do nothing`) — safe to run in PREVIEW/STAGING.
- STAGING restores from sanitized PROD snapshot; never real user secrets.
- PROD deploys require: GHA green + RLS tests + e2e smoke + manual promote.
