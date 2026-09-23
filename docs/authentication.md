# Authentication

Supabase Auth is the sole identity provider. No custom password tables.

## Methods (MVP)

- Email + Password (enabled day 1)
- Magic Link (enabled day 1)
- Google OAuth (stub config, enable post-MVP)
- Microsoft OAuth (stub config, enable post-MVP)
- Enterprise SSO (SAML/OIDC-ready seam: `sso_domains` on workspace, no implementation now)

## Flow

1. `/login` (client) → `supabase.auth.signInWithPassword` / `signInWithOtp`.
2. `/auth/callback/route.ts` exchanges code → sets httpOnly cookies via `@supabase/ssr`.
3. `middleware.ts` refreshes session on every `/app/*` request.
4. `/app/layout.tsx` (server): `getUser()` → `profiles` upsert via trigger → `workspace_members` lookup → no membership = 403 + invite prompt.
5. `/forgot-password` → `resetPasswordForEmail` → `/auth/callback?next=/reset`.

## Profiles trigger

`handle_new_user()` on `auth.users` insert → `profiles(id, email, full_name from metadata)`.
Never expose `auth.*` tables to client; RLS denies all except service_role.

## Cookies / session

Secure, httpOnly, SameSite=Lax, `PKCE` flow. Service-role key server-only.
`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` only client-safe values.

## MFA

Supabase MFA (TOTP) flag in settings; enforced for OWNER/ADMIN post-MVP via `factor` check
in guard. Checklist item in Security Center from day 1.
