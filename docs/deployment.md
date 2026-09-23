# Deployment — GitHub → Vercel + Supabase (target: roadmapchurch.crdo.site)

## Target

- Web: Vercel project `roadmapchurch` (Next.js 16.3.6, Node 22.x), production branch `main`
- URL: `https://roadmapchurch.crdo.site` (custom domain on `crdo.site` in team `jules-357d`)
- Data/Auth/Storage: Supabase project (PostgreSQL + Auth + private Storage buckets)
- Source/CI: GitHub `crdo0923/church_app` + GitHub Actions
- Observability: Sentry + Vercel Observability + structured logs
- Optional: Cloudflare DNS/CDN/WAF (DNS is third-party today — see §4)

## Pipeline

```
git push main → GHA (lint/typecheck/unit/build/e2e/security)
  → Vercel Preview (per-PR, `*.vercel.app`)
  → merge → Staging (release candidate) → manual Promote → Production (roadmapchurch.crdo.site)
```

Required checks before prod promote: lint, typecheck, unit, build, e2e smoke,
`npm audit` / semgrep, RLS policy tests. Rollback = Vercel instant rollback (no data migration rollback without explicit plan).

## Vercel project wiring (repo: church_app)

1. `vercel link` (or Import via dashboard) → root `./`, framework Next.js, build `next build`.
2. Env (Production + Preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` (server-only), `NEXT_PUBLIC_APP_URL=https://roadmapchurch.crdo.site`,
   `SENTRY_DSN` (optional), `GITHUB_TOKEN` (optional, server-only).
3. `vercel domains add roadmapchurch.crdo.site` → Vercel gives `CNAME cname.vercel-dns.com`.
4. DNS (third-party registrar for `crdo.site`): add `CNAME roadmapchurch → cname.vercel-dns.com`
   (same pattern as `events/docs/cine.crdo.site`). Apex stays untouched.
5. Verify: `vercel domains inspect roadmapchurch.crdo.site` → `dig roadmapchurch.crdo.site` → HTTPS 200.

Precedent in team: `events.crdo.site` (multiply-talents), `docs.crdo.site`, `cine.crdo.site` —
same CNAME pattern, `iad1/sfo1` regions, Node 24.x (we pin 22.x matching local).

## What NOT to do

No PostgreSQL on Vercel, no uploads to app filesystem (Supabase Storage only),
no service-role / secrets in client bundle, no `NEXT_PUBLIC_*` for secrets.
