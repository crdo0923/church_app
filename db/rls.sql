-- ============================================================
-- RLS policies — Church Leadership LMS Command Center (Phase D)
-- Run AFTER `drizzle-kit migrate` on the Supabase project.
-- psql "$DATABASE_URL" -f db/rls.sql
-- ============================================================

-- ---------- helpers ----------
create or replace function public.is_workspace_member(wid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = wid and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.member_role(wid uuid)
returns text language sql stable security definer set search_path = public as $$
  select role::text from public.workspace_members
  where workspace_id = wid and user_id = auth.uid() and status = 'active'
  limit 1;
$$;

-- ---------- profiles ----------
alter table public.profiles enable row level security;
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select to authenticated using (id = auth.uid());
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update to authenticated using (id = auth.uid());

-- ---------- workspaces ----------
alter table public.workspaces enable row level security;
drop policy if exists "workspaces_member_read" on public.workspaces;
create policy "workspaces_member_read" on public.workspaces
  for select to authenticated using (public.is_workspace_member(id));

-- ---------- generic workspace-scoped tables ----------
-- Apply member-read to every workspace-scoped table listed in db/rls.ts.
-- Write policies: authenticated members except viewer; audit_logs insert-only.

do $$
declare t text;
begin
  foreach t in array array[
    'projects','roadmap_phases','milestones','tasks','risks','technical_decisions',
    'architecture_components','technology_stack_items','integrations',
    'environments','deployments','documents','comments','notifications'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_member_read', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_workspace_member(workspace_id))',
      t || '_member_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_member_write', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_workspace_member(workspace_id) and public.member_role(workspace_id) <> ''viewer'') with check (public.is_workspace_member(workspace_id) and public.member_role(workspace_id) <> ''viewer'')',
      t || '_member_write', t);
  end loop;
end $$;

-- ---------- audit_logs: append-only ----------
alter table public.audit_logs enable row level security;
drop policy if exists "audit_logs_member_read" on public.audit_logs;
create policy "audit_logs_member_read" on public.audit_logs
  for select to authenticated using (public.is_workspace_member(workspace_id));
drop policy if exists "audit_logs_member_insert" on public.audit_logs;
create policy "audit_logs_member_insert" on public.audit_logs
  for insert to authenticated with check (public.is_workspace_member(workspace_id));
-- NOTE: no update/delete policies => denied for authenticated by default.
