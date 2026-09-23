# Integrations — 7 providers as configuration/health records first (MVP)

No live third-party sync in MVP. Each provider is a DB record (`integrations`) + docs page,
so status/health/owner/endpoints are tracked before any OAuth/API key exists.

| Provider | Category | MVP status | Later live scope |
|---|---|---|---|
| GoHighLevel | CRM/automation | PLANNED | contacts, enrollment workflow, webhook inbound |
| Google Workspace | identity/docs/calendar | PLANNED | OAuth, Drive/Calendar read |
| Microsoft 365 | identity/mail/calendar | PLANNED | OAuth, Graph read |
| Email Service | messaging | CONFIGURING | transactional via provider API (server-only key) |
| SMS / Messaging | messaging | PLANNED | reminders, opt-in proof |
| Payment Provider | billing | PLANNED | enrollment fees, webhooks |
| Video Conferencing | classes | PLANNED | meeting links, recordings metadata |

Record fields: provider, category, status (`PLANNED|CONFIGURING|CONNECTED|HEALTHY|DEGRADED|DISABLED`),
auth_method, endpoints (jsonb), webhook_support, owner, docs_url, environment, health, last_checked_at.

## Rules

- Secrets server-only; health checks run in Route Handlers, never browser.
- Inbound webhooks: signature verification + idempotency key + retry queue design (no broker in MVP —
  DB-backed `webhook_events` table with `status/attempts/next_retry_at`).
- Each integration page shows: status badge, owner, environment, endpoints table, webhook table,
  setup checklist, link to `docs/integrations.md` section.
