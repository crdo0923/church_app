# Database — PostgreSQL (Supabase) + Drizzle + RLS

## 1. Conventions

- UUID PKs (`gen_random_uuid()`), `created_at/updated_at` (timestamptz, `now()`), plus
  `created_by/updated_by` (auth.users FK) where ownership matters.
- Enums as Postgres enums or check constraints: project/phase/task/milestone statuses,
  task priority, ADR status, integration status/health, env names, audit actions.
- FKs with `on delete cascade` inside workspace scope, `restrict` across it.
- Indexes intentionally: all FKs, `(workspace_id, status)`, `(phase_id, status)`,
  `(milestone_id)`, `(assignee)`, `(due_date)`, GIN full-text on `tasks(title,description)`
  and `documents(title,content)`. No blanket over-indexing.

## 2. Entity inventory (workspace-scoped unless noted)

**Identity (global + membership):** `profiles(id uuid PK = auth.users.id, email, full_name,
avatar_url)`, `workspaces(id, name, slug unique, settings jsonb)`, `workspace_members(
workspace_id, user_id, role, status, PK(workspace_id,user_id))`, `roles(code PK, description)`
seed: owner/admin/architect/project_manager/engineer/designer/qa/viewer.

**Delivery:** `projects(workspace_id, name, status, current_phase_id, release_target_date)`,
`roadmap_phases(project_id, number, name, status, owner_id, start_date, target_date,
manual_progress_override numeric null, progress_updated_at)`, `milestones(phase_id,
title, success_criteria text[], status, owner_id, target_date, completed_at)`,
`tasks(phase_id, milestone_id null, title, description, status, priority, estimate_h,
actual_h, start_date, due_date, github_repo, github_issue_number, github_pr_number,
github_url, doc_url)`, `task_assignees(task_id, user_id)`, `labels(id, workspace_id,
name, color)`, `task_labels(task_id, label_id)`, `task_checklist(task_id, title, done, position)`,
`task_dependencies(from_task_id, to_task_id, type: blocks|depends_on|relates, CHECK(from<>to))`,
`phase_dependencies(from_phase_id, to_phase_id)`, `milestone_tasks(milestone_id, task_id)`.

**Knowledge:** `risks(workspace_id, project_id, title, description, probability, impact,
severity generated, owner_id, mitigation, status, due_date)`, `technical_decisions(
workspace_id, project_id, adr_number unique per project, title, status, context, decision,
consequences, alternatives, author_id)`, `architecture_components(workspace_id, project_id,
layer: users|web|api|data|integration|external|observability, name, tech, owner_id, doc_url)`,
`architecture_connections(from_id, to_id, label)`, `technology_stack_items(workspace_id,
category, name, purpose, status, why_selected, alternative, used_by, docs_url)`,
`integrations(workspace_id, provider: ghl|google|m365|email|sms|payments|video, category,
status, auth_method, endpoints jsonb, webhook_support bool, owner_id, docs_url, environment, health)`.

**Operations:** `environments(workspace_id, name: local|development|preview|staging|production,
description, config jsonb, unique(workspace_id,name))`, `deployments(environment_id,
version, commit_sha, status, url, build_duration_s, deployed_by, deployed_at)`,
`documents(workspace_id, project_id, slug, title, category, author_id, version, content_md)`,
`document_versions(document_id, version, content_md, created_by)`, `comments(workspace_id,
entity_type, entity_id, body, author_id)`, `notifications(workspace_id, user_id, type,
actor_id, entity_type, entity_id, title, body, read_at)`, `audit_logs(workspace_id,
actor_id, action, entity, entity_id, from_value jsonb, to_value jsonb, metadata jsonb,
created_at)` — **append-only** (no UPDATE/DELETE except service_role retention).

## 3. Progress logic (derived, never hand-entered)

```sql
-- phase progress
select count(*) filter (where status='DONE')::float / nullif(count(*),0) from tasks where phase_id = $1;
-- milestone analogous via milestone_tasks join; project = weighted avg of phases.
```

App caches into `phase_progress_cache` only with `last_calculated_at`; manual override
requires explicit `manual_progress_override` + reason written to audit.

## 4. RLS model (boundary, not garnish)

- `enable row level security` on every app table; `force` for defense in depth.
- Helper: `is_member(wid)` / `member_role(wid)` reading `workspace_members` for `auth.uid()`.
- Read: `USING (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid() and status='active'))`.
- Write: same + `member_role()` in allowlist per table (e.g. tasks: anyone except viewer;
  roles/members/audit-select: admin/owner; audit insert: via trigger with service_role or
  `with check (true)` scoped to authenticated + trigger-filled actor).
- `profiles`: user reads/updates own row; admins read workspace-mate profiles via view.
- Deny by default; least privilege; each policy documented with a test case in `rls.sql` header.

## 5. Migrations + seed (Drizzle)

`db/schema/*.ts` is the single source → `drizzle-kit generate` → versioned SQL in
`db/migrations/` → `drizzle-kit migrate` in CI/staging/prod. `db/seed.ts` is idempotent
(`on conflict do nothing/update`): 1 workspace "Church Leadership LMS", 1 project, 10 phases
(01 Foundation … 10 Production per spec §31) with milestones/tasks, tech stack (13 categories),
7 integrations (PLANNED), 5 environments, sample risks/ADRs/docs, owner membership.
Full DDL ships in Phase D; this doc is the contract it must satisfy.
