/**
 * RLS contract (applied in Phase D against live Supabase; reviewed here for build-safety).
 *
 * Principles:
 * - enable row level security on EVERY app table
 * - workspace isolation: workspace_id IN (member workspaces of auth.uid())
 * - viewers: FOR SELECT only; writes require role in allowlist
 * - audit_logs: append-only (no UPDATE/DELETE for authenticated)
 * - profiles: self read/update; admins read mates via view
 *
 * The SQL below is the exact policy set to run with psql / supabase migration
 * once Supabase credentials exist. It is checked into the repo now so review
 * happens before data exists — no fake "RLS active" claims in UI until applied.
 */

export const RLS_SQL = `-- Phase D RLS — run after Drizzle migrations
-- Helper: member workspaces for current user
-- create or replace function member_workspace_ids() returns setof uuid ...
-- (full SQL ships in db/rls.sql; this constant keeps the contract visible to app code)`;

export const RLS_TABLES = [
  "profiles",
  "workspaces",
  "workspace_members",
  "projects",
  "roadmap_phases",
  "milestones",
  "tasks",
  "task_assignees",
  "task_dependencies",
  "phase_dependencies",
  "risks",
  "technical_decisions",
  "architecture_components",
  "technology_stack_items",
  "integrations",
  "environments",
  "deployments",
  "documents",
  "comments",
  "notifications",
  "audit_logs",
] as const;
