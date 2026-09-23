# Authorization (RBAC) — server-side + RLS, never UI-only

## Roles (8)

`owner > admin > architect > project_manager > engineer > designer > qa > viewer`

| Capability | owner | admin | architect | pm | engineer | designer | qa | viewer |
|---|---|---|---|---|---|---|---|---|
| Workspace / members / roles | ✓ | ✓ | — | — | — | — | — | — |
| Roadmap phases/milestones/tasks CRUD | ✓ | ✓ | RW | RW | assigned | UI tasks | bugs | R |
| Dependencies | ✓ | ✓ | RW | RW | R | R | R | R |
| Architecture / ADRs / docs | ✓ | ✓ | RW | R | R+comment | design docs | R | R |
| Risks / blockers | ✓ | ✓ | RW | RW | update own | — | raise | R |
| Environments / deployments | ✓ | ✓ | R | R | R | — | verify | R |
| Security checklist | ✓ | ✓ | RW | R | R | — | verify | R |
| Audit logs (read) | ✓ | ✓ | ✓ | ✓ | own | — | — | — |
| Settings | ✓ | ✓ | — | — | — | — | — | — |

R = read, RW = read+write in scope, ✓ = allowed.

## Enforcement layers (all three, always)

1. **Route guard (server):** `/app/layout.tsx` + each action/handler calls
   `requireSession() → requireMembership(workspaceId) → requirePermission(action)`.
   Fail closed: no session → `/login`, no membership → 403, insufficient role → 403.
2. **Database RLS:** every app table `enable row level security`; policies check
   `workspace_members` for `auth.uid()`. VIEWER gets `FOR SELECT` only. Audit = append-only.
   Frontend hiding buttons is UX only — never a security boundary.
3. **Validation:** Zod schemas in `server/validations/`; every mutation parses + strips unknown keys.

## Isolation tests (Phase C/D gate)

- Member of workspace A cannot read workspace B rows (RLS returns 0 rows).
- VIEWER `insert/update/delete` → 42501 denied.
- Non-member API call → 403 before any query runs.
- Audit `update/delete` as authenticated → denied.
