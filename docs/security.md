# Security model

## Boundaries

1. **AuthN:** Supabase Auth (email+password, magic link; OAuth stubs). Session via httpOnly cookies.
2. **AuthZ:** server guards + PostgreSQL RLS (workspace isolation). Frontend role checks are UX only.
3. **Input:** Zod on every mutation; file uploads to Supabase Storage private buckets with MIME/size limits.
4. **Secrets:** `.env.example` documents shape; real values in Vercel env / `.env.local` (git-ignored).
   `SUPABASE_SERVICE_ROLE_KEY` server-only. CI secret scan (gitleaks/semgrep) blocks leaks.
5. **Transport/app:** HTTPS (Vercel), security headers in `next.config` (HSTS, CSP tight, frame-ancestors,
   referrer-policy), CSRF where cookie-mutating non-Next patterns exist, rate-limit auth + webhook routes.
6. **Audit:** append-only `audit_logs` via DB trigger on sensitive transitions (role change, status change,
   membership change, deployment promote). No UI edit path.

## Security Center checklist (states: NOT_STARTED → IN_PROGRESS → IMPLEMENTED → VERIFIED)

- [ ] MFA enforced (OWNER/ADMIN)
- [ ] RLS enabled + tested on all tables
- [ ] Secure cookies / SameSite / PKCE
- [ ] Input validation (Zod) on all mutations
- [ ] Rate limiting (auth, webhooks, search)
- [ ] API authorization (server guards)
- [ ] Audit logging triggers active
- [ ] Secret management (no committed secrets)
- [ ] Backup verification (Supabase PITR)
- [ ] Restore testing (staging drill)
- [ ] Dependency scanning (Dependabot + npm audit in CI)
- [ ] Security headers (next.config + verify)

## Never

Commit `.env.local`, log secrets, expose service-role to browser, rely on hidden buttons,
trust `X-User-Role` headers, or store uploads on app filesystem.
