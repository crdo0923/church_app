/**
 * Tracker store — Postgres-backed, async throughout.
 *
 * - Reads hit Postgres when DATABASE_URL is set; fall back to the bundled
 *   seed snapshot ONLY when the DB is unreachable (never fake writes).
 * - Writes go to Postgres; { ok:false } when unavailable (UI shows messaging).
 * - NOTHING here talks to GitHub/Vercel/LMS/external APIs. Humans update;
 *   the tracker records (§38, §53).
 */

import { ensureSchema, getSql } from "./pg";
import {
  nowIso,
  newId,
  hashToken,
  hashPassword,
  verifyPassword,
  newSessionToken,
} from "./tracker-db";
import { PHASES, PROJECT_SEED } from "../data/tracker-seed";
import type { TrackerRole, AccountStatus } from "./validation";

/* ---------------- types ---------------- */

export interface TrackerUser {
  id: string;
  fullName: string;
  email: string;
  role: TrackerRole;
  status: AccountStatus;
  notes: string;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
}

export interface AuditEntry {
  id: string;
  actorId: string | null;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Criterion {
  id: string;
  entityType: "phase" | "milestone" | "task";
  entityId: string;
  label: string;
  category: string;
  requirement: "REQUIRED" | "OPTIONAL" | "NOT_APPLICABLE";
  status: "COMPLETE" | "INCOMPLETE" | "NOT_APPLICABLE";
  notes: string;
  position: number;
}

export interface Evidence {
  id: string;
  entityType: string;
  entityId: string;
  kind: string;
  label: string;
  url: string;
  text: string;
  createdBy: string | null;
  createdAt: string;
}

export interface CompletionRecord {
  id: string;
  entityType: string;
  entityId: string;
  action: "COMPLETED" | "REOPENED" | "OVERRIDE_COMPLETED";
  notes: string;
  overrideReason: string;
  actorId: string | null;
  createdAt: string;
}

export interface ProjectState {
  projectStatus: string;
  currentPhaseNumber: string;
  overallProgress: number;
  progressSource: "MANUAL" | "CALCULATED";
  currentFocus: string;
  blockerNote: string;
  updatedBy: string | null;
  updatedAt: string;
}

export interface ProjectUpdate {
  id: string;
  projectStatus: string;
  currentPhaseNumber: string;
  overallProgress: number;
  progressSource: string;
  currentFocus: string;
  whatChanged: string;
  whatsNext: string;
  blockerNote: string;
  updateNote: string;
  createdBy: string | null;
  createdAt: string;
}

/* ---------------- helpers ---------------- */

type Row = Record<string, unknown>;

function rowToUser(r: Row): TrackerUser {
  return {
    id: String(r.id),
    fullName: String(r.full_name ?? ""),
    email: String(r.email ?? ""),
    role: r.role as TrackerRole,
    status: r.status as AccountStatus,
    notes: String(r.notes ?? ""),
    mustChangePassword: Number(r.must_change_password ?? 0) === 1,
    createdAt: String(r.created_at ?? ""),
    updatedAt: String(r.updated_at ?? ""),
  };
}

async function db() {
  const ok = await ensureSchema();
  if (!ok) return null;
  return getSql();
}

export async function audit(entry: {
  actorId?: string | null;
  actorEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const sql = await db();
  if (!sql) return;
  await sql`
    INSERT INTO audit_log (id, actor_id, actor_email, action, entity, entity_id, metadata, created_at)
    VALUES (${newId()}, ${entry.actorId ?? null}, ${entry.actorEmail ?? ""}, ${entry.action}, ${entry.entity}, ${entry.entityId ?? ""}, ${JSON.stringify(entry.metadata ?? {})}, ${nowIso()})
  `;
}

export async function bootstrapNeeded(): Promise<boolean> {
  const sql = await db();
  if (!sql) return true;
  const rows = await sql`SELECT COUNT(*)::int AS n FROM users WHERE role = 'SUPER_ADMIN'`;
  return Number(rows[0]?.n ?? 0) === 0;
}

/* ---------------- auth ---------------- */

export async function findUserByEmail(email: string): Promise<TrackerUser | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql`SELECT * FROM users WHERE lower(email) = lower(${email}) LIMIT 1`;
  return rows[0] ? rowToUser(rows[0] as Row) : null;
}

export async function findUserById(id: string): Promise<TrackerUser | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
  return rows[0] ? rowToUser(rows[0] as Row) : null;
}

export async function verifyUserPassword(userId: string, password: string): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;
  const rows = await sql`SELECT password_hash FROM users WHERE id = ${userId} LIMIT 1`;
  if (!rows[0]) return false;
  return verifyPassword(password, String(rows[0].password_hash));
}

export async function createSession(userId: string): Promise<Session | null> {
  const sql = await db();
  if (!sql) return null;
  const token = newSessionToken();
  const id = newId();
  const now = new Date();
  const expires = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14).toISOString();
  await sql`
    INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at)
    VALUES (${id}, ${userId}, ${hashToken(token)}, ${now.toISOString()}, ${expires})
  `;
  return { id, userId, token, expiresAt: expires };
}

export async function getSessionUser(token: string | undefined | null): Promise<TrackerUser | null> {
  if (!token) return null;
  const sql = await db();
  if (!sql) return null;
  const rows = await sql`
    SELECT s.expires_at, u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ${hashToken(token)} LIMIT 1
  `;
  if (!rows[0]) return null;
  const row = rows[0] as Row;
  if (new Date(String(row.expires_at)).getTime() < Date.now()) return null;
  const user = rowToUser(row);
  if (user.status === "DISABLED" || user.status === "SUSPENDED") return null;
  return user;
}

export async function destroySession(token: string): Promise<void> {
  const sql = await db();
  if (!sql) return;
  await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  role: TrackerRole;
  status?: AccountStatus;
  notes?: string;
  password?: string;
  mustChangePassword?: boolean;
  actorId?: string | null;
  actorEmail?: string;
}

export async function createUser(
  input: CreateUserInput,
): Promise<{ ok: boolean; user?: TrackerUser; error?: string }> {
  const sql = await db();
  if (!sql) return { ok: false, error: "Database unavailable" };
  const existing = await sql`SELECT id FROM users WHERE lower(email) = lower(${input.email}) LIMIT 1`;
  if (existing[0]) return { ok: false, error: "Email already in use" };
  const id = newId();
  const now = nowIso();
  const password = input.password ?? newSessionToken().slice(0, 16);
  await sql`
    INSERT INTO users (id, full_name, email, password_hash, role, status, notes, must_change_password, created_at, updated_at)
    VALUES (${id}, ${input.fullName}, ${input.email.toLowerCase()}, ${hashPassword(password)}, ${input.role}, ${input.status ?? "ACTIVE"}, ${input.notes ?? ""}, ${input.mustChangePassword ? 1 : 0}, ${now}, ${now})
  `;
  await audit({
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    action: "user.created",
    entity: "user",
    entityId: id,
    metadata: { email: input.email.toLowerCase(), role: input.role },
  });
  return { ok: true, user: (await findUserById(id)) ?? undefined };
}

/* ---------------- seed ---------------- */

const DEFAULT_CRITERION_STATUS = "INCOMPLETE";

export async function seedSnapshot(): Promise<{ seeded: boolean; reason: string }> {
  const sql = await db();
  if (!sql) return { seeded: false, reason: "Database unavailable — set DATABASE_URL" };

  for (const phase of PHASES) {
    const phaseId = `phase-${phase.number}`;
    for (const [i, d] of phase.deliverables.entries()) {
      const id = `${phaseId}-deliverable-${i}`;
      await sql`
        INSERT INTO deliverables (id, phase_number, label, owner, status, notes, position, created_at, updated_at)
        VALUES (${id}, ${phase.number}, ${d.label}, ${d.owner}, 'INCOMPLETE', '', ${i}, ${nowIso()}, ${nowIso()})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    for (const [i, a] of phase.acceptance.entries()) {
      const id = `${phaseId}-criterion-${i}`;
      await sql`
        INSERT INTO criteria (id, entity_type, entity_id, label, category, requirement, status, notes, position, created_at, updated_at)
        VALUES (${id}, 'phase', ${phaseId}, ${a.label}, ${a.category}, 'REQUIRED', ${DEFAULT_CRITERION_STATUS}, '', ${i}, ${nowIso()}, ${nowIso()})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    for (const m of phase.milestones) {
      await sql`
        INSERT INTO milestones (id, phase_number, title, description, objective, owner, target_date, created_at, updated_at)
        VALUES (${m.id}, ${phase.number}, ${m.title}, ${m.description}, ${m.objective}, ${m.owner}, ${m.targetDate}, ${nowIso()}, ${nowIso()})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    for (const task of phase.tasks) {
      await sql`
        INSERT INTO tasks (id, phase_number, milestone_id, title, summary, description, owner, priority, target_date, dependencies, technical_notes, created_at, updated_at)
        VALUES (${task.id}, ${phase.number}, ${task.milestoneId}, ${task.title}, ${task.summary}, ${task.description}, ${task.owner}, 'MEDIUM', '', '', '', ${nowIso()}, ${nowIso()})
        ON CONFLICT (id) DO NOTHING
      `;
    }
  }
  const updates = await sql`SELECT COUNT(*)::int AS n FROM project_updates`;
  if (Number(updates[0]?.n ?? 0) === 0) {
    await sql`
      UPDATE project_state SET project_status=${PROJECT_SEED.status}, current_phase_number=${PROJECT_SEED.currentPhaseNumber},
        overall_progress=${PROJECT_SEED.overallProgress}, progress_source=${PROJECT_SEED.progressSource},
        current_focus=${PROJECT_SEED.currentFocus}, blocker_note=${PROJECT_SEED.blockerNote}, updated_at=${nowIso()}
      WHERE id='singleton'
    `;
  }
  return { seeded: true, reason: `Seed ensured (${PHASES.length} phases)` };
}

/* ---------------- project state ---------------- */

const FALLBACK_STATE: ProjectState = {
  projectStatus: PROJECT_SEED.status,
  currentPhaseNumber: PROJECT_SEED.currentPhaseNumber,
  overallProgress: PROJECT_SEED.overallProgress,
  progressSource: PROJECT_SEED.progressSource,
  currentFocus: PROJECT_SEED.currentFocus,
  blockerNote: PROJECT_SEED.blockerNote,
  updatedBy: null,
  updatedAt: "",
};

export async function getProjectState(): Promise<ProjectState> {
  const sql = await db();
  if (sql) {
    const rows = await sql`SELECT * FROM project_state WHERE id='singleton' LIMIT 1`;
    const row = rows[0] as Row | undefined;
    if (row) {
      return {
        projectStatus: String(row.project_status),
        currentPhaseNumber: String(row.current_phase_number),
        overallProgress: Number(row.overall_progress),
        progressSource: row.progress_source === "MANUAL" ? "MANUAL" : "CALCULATED",
        currentFocus: String(row.current_focus ?? ""),
        blockerNote: String(row.blocker_note ?? ""),
        updatedBy: (row.updated_by as string) ?? null,
        updatedAt: String(row.updated_at),
      };
    }
  }
  return FALLBACK_STATE;
}

export async function saveProjectUpdate(input: {
  projectStatus: string;
  currentPhaseNumber: string;
  overallProgress: number;
  progressSource: "MANUAL" | "CALCULATED";
  currentFocus: string;
  whatChanged: string;
  whatsNext: string;
  blockerNote: string;
  updateNote: string;
  actorId?: string | null;
  actorEmail?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const sql = await db();
  if (!sql) return { ok: false, error: "Database unavailable" };
  const id = newId();
  const now = nowIso();
  await sql`
    INSERT INTO project_updates (id, project_status, current_phase_number, overall_progress, progress_source, current_focus, what_changed, whats_next, blocker_note, update_note, created_by, created_at)
    VALUES (${id}, ${input.projectStatus}, ${input.currentPhaseNumber}, ${input.overallProgress}, ${input.progressSource}, ${input.currentFocus}, ${input.whatChanged}, ${input.whatsNext}, ${input.blockerNote}, ${input.updateNote}, ${input.actorId ?? null}, ${now})
  `;
  await sql`
    UPDATE project_state SET project_status=${input.projectStatus}, current_phase_number=${input.currentPhaseNumber},
      overall_progress=${input.overallProgress}, progress_source=${input.progressSource},
      current_focus=${input.currentFocus}, blocker_note=${input.blockerNote},
      updated_by=${input.actorId ?? null}, updated_at=${now} WHERE id='singleton'
  `;
  await audit({
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    action: "project.updated",
    entity: "project",
    entityId: "singleton",
    metadata: {
      status: input.projectStatus,
      phase: input.currentPhaseNumber,
      progress: input.overallProgress,
      source: input.progressSource,
    },
  });
  return { ok: true };
}

export async function listProjectUpdates(limit = 20): Promise<ProjectUpdate[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql`SELECT * FROM project_updates ORDER BY created_at DESC LIMIT ${limit}`;
  return (rows as Row[]).map((r) => ({
    id: String(r.id),
    projectStatus: String(r.project_status),
    currentPhaseNumber: String(r.current_phase_number),
    overallProgress: Number(r.overall_progress),
    progressSource: String(r.progress_source),
    currentFocus: String(r.current_focus ?? ""),
    whatChanged: String(r.what_changed ?? ""),
    whatsNext: String(r.whats_next ?? ""),
    blockerNote: String(r.blocker_note ?? ""),
    updateNote: String(r.update_note ?? ""),
    createdBy: (r.created_by as string) ?? null,
    createdAt: String(r.created_at),
  }));
}

/* ---------------- phases / milestones / tasks (read) ---------------- */

export interface PhaseView {
  number: string;
  name: string;
  summary: string;
  objective: string;
  scope: string[];
  outOfScope: string[];
  owner: string;
  target: string;
  dependencies: string;
  status: string;
  progress: number;
  progressSource: "MANUAL" | "CALCULATED";
  risks: string[];
  blockers: string[];
  completionNotes: string;
  milestoneCount: number;
  taskCount: number;
  openBlockerCount: number;
  lastUpdated: string;
}

export async function getItemStatus(
  entityType: string,
  entityId: string,
  fallback: string,
): Promise<string> {
  const sql = await db();
  if (!sql) return fallback;
  const rows = await sql`SELECT status FROM item_status WHERE entity_type = ${entityType} AND entity_id = ${entityId} LIMIT 1`;
  return rows[0] ? String(rows[0].status) : fallback;
}

export async function taskDoneCount(phaseNumber: string): Promise<{ done: number; total: number }> {
  const seedTasks = PHASES.find((p) => p.number === phaseNumber)?.tasks ?? [];
  if (seedTasks.length === 0) return { done: 0, total: 0 };
  const sql = await db();
  if (!sql) return { done: 0, total: seedTasks.length };
  let done = 0;
  for (const t of seedTasks) {
    const s = await getItemStatus("task", t.id, "BACKLOG");
    if (s === "DONE" || s === "COMPLETED") done++;
  }
  return { done, total: seedTasks.length };
}

export async function listPhases(): Promise<PhaseView[]> {
  const out: PhaseView[] = [];
  for (const [idx, p] of PHASES.entries()) {
    const phaseId = `phase-${p.number}`;
    const status =
      idx === 0
        ? await getItemStatus("phase", phaseId, "IN_PROGRESS")
        : await getItemStatus("phase", phaseId, "PLANNED");
    const { done, total } = await taskDoneCount(p.number);
    const calc = total === 0 ? 0 : Math.round((done / total) * 100);
    const sql = await db();
    let manual: number | null = null;
    if (sql) {
      const rows = await sql`SELECT percent FROM manual_progress WHERE entity_type='phase' AND entity_id=${phaseId} LIMIT 1`;
      if (rows[0]) manual = Number(rows[0].percent);
    }
    // Phase 01 ships at the human-set 42% manual snapshot until someone updates it.
    if (manual === null && p.number === "01") manual = 42;
    const progress = manual ?? calc;
    out.push({
      number: p.number,
      name: p.name,
      summary: p.summary,
      objective: p.objective,
      scope: p.scope,
      outOfScope: p.outOfScope,
      owner: p.owner,
      target: p.target,
      dependencies: p.dependencies,
      status,
      progress,
      progressSource: manual !== null ? "MANUAL" : "CALCULATED",
      risks: p.risks,
      blockers: p.blockers,
      completionNotes: p.completionNotes,
      milestoneCount: p.milestones.length,
      taskCount: p.tasks.length,
      openBlockerCount: p.blockers.length,
      lastUpdated: "",
    });
  }
  return out;
}

export function getPhase(number: string) {
  return PHASES.find((p) => p.number === number) ?? null;
}

/* ---------------- criteria / evidence / completion ---------------- */

export async function listCriteria(entityType: string, entityId: string): Promise<Criterion[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql`SELECT * FROM criteria WHERE entity_type=${entityType} AND entity_id=${entityId} ORDER BY position, created_at`;
  return (rows as Row[]).map((r) => ({
    id: String(r.id),
    entityType: r.entity_type as Criterion["entityType"],
    entityId: String(r.entity_id),
    label: String(r.label),
    category: String(r.category),
    requirement: r.requirement as Criterion["requirement"],
    status: r.status as Criterion["status"],
    notes: String(r.notes ?? ""),
    position: Number(r.position ?? 0),
  }));
}

export async function addCriterion(input: {
  entityType: "phase" | "milestone" | "task";
  entityId: string;
  label: string;
  category: string;
  requirement: "REQUIRED" | "OPTIONAL" | "NOT_APPLICABLE";
  actorId?: string | null;
  actorEmail?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const sql = await db();
  if (!sql) return { ok: false, error: "Database unavailable" };
  const count = await sql`SELECT COUNT(*)::int AS n FROM criteria WHERE entity_type=${input.entityType} AND entity_id=${input.entityId}`;
  const id = newId();
  await sql`
    INSERT INTO criteria (id, entity_type, entity_id, label, category, requirement, status, notes, position, created_at, updated_at)
    VALUES (${id}, ${input.entityType}, ${input.entityId}, ${input.label}, ${input.category}, ${input.requirement}, 'INCOMPLETE', '', ${Number(count[0]?.n ?? 0)}, ${nowIso()}, ${nowIso()})
  `;
  await audit({ actorId: input.actorId, actorEmail: input.actorEmail, action: "criterion.added", entity: input.entityType, entityId: input.entityId, metadata: { label: input.label } });
  return { ok: true };
}

export async function setCriterionStatus(
  id: string,
  status: "COMPLETE" | "INCOMPLETE" | "NOT_APPLICABLE",
  actor: { id?: string | null; email?: string },
): Promise<{ ok: boolean; error?: string }> {
  const sql = await db();
  if (!sql) return { ok: false, error: "Database unavailable" };
  const rows = await sql`SELECT * FROM criteria WHERE id=${id} LIMIT 1`;
  if (!rows[0]) return { ok: false, error: "Criterion not found" };
  const row = rows[0] as Row;
  await sql`UPDATE criteria SET status=${status}, updated_at=${nowIso()} WHERE id=${id}`;
  await audit({ actorId: actor.id, actorEmail: actor.email, action: "criterion.updated", entity: String(row.entity_type), entityId: String(row.entity_id), metadata: { criterionId: id, status } });
  return { ok: true };
}

export async function listEvidence(entityType: string, entityId: string): Promise<Evidence[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql`SELECT * FROM evidence WHERE entity_type=${entityType} AND entity_id=${entityId} ORDER BY created_at DESC`;
  return (rows as Row[]).map((r) => ({
    id: String(r.id),
    entityType: String(r.entity_type),
    entityId: String(r.entity_id),
    kind: String(r.kind),
    label: String(r.label),
    url: String(r.url ?? ""),
    text: String(r.text ?? ""),
    createdBy: (r.created_by as string) ?? null,
    createdAt: String(r.created_at),
  }));
}

export async function addEvidence(input: {
  entityType: string;
  entityId: string;
  kind: string;
  label: string;
  url: string;
  text: string;
  actorId?: string | null;
  actorEmail?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const sql = await db();
  if (!sql) return { ok: false, error: "Database unavailable" };
  await sql`
    INSERT INTO evidence (id, entity_type, entity_id, kind, label, url, text, created_by, created_at)
    VALUES (${newId()}, ${input.entityType}, ${input.entityId}, ${input.kind}, ${input.label}, ${input.url}, ${input.text}, ${input.actorId ?? null}, ${nowIso()})
  `;
  await audit({ actorId: input.actorId, actorEmail: input.actorEmail, action: "evidence.added", entity: input.entityType, entityId: input.entityId, metadata: { label: input.label, kind: input.kind } });
  return { ok: true };
}

export async function setItemStatus(
  entityType: "phase" | "milestone" | "task",
  entityId: string,
  status: string,
  actor: { id?: string | null; email?: string },
  note = "",
): Promise<{ ok: boolean; error?: string }> {
  const sql = await db();
  if (!sql) return { ok: false, error: "Database unavailable" };
  const prev = await getItemStatus(entityType, entityId, "");
  await sql`
    INSERT INTO item_status (entity_type, entity_id, status, updated_by, updated_at)
    VALUES (${entityType}, ${entityId}, ${status}, ${actor.id ?? null}, ${nowIso()})
    ON CONFLICT (entity_type, entity_id) DO UPDATE SET status=EXCLUDED.status, updated_by=EXCLUDED.updated_by, updated_at=EXCLUDED.updated_at
  `;
  await audit({ actorId: actor.id, actorEmail: actor.email, action: "status.changed", entity: entityType, entityId, metadata: { from: prev, to: status, note } });
  return { ok: true };
}

export async function recordCompletion(
  entityType: "phase" | "milestone" | "task",
  entityId: string,
  action: "COMPLETED" | "REOPENED" | "OVERRIDE_COMPLETED",
  notes: string,
  overrideReason: string,
  actor: { id?: string | null; email?: string },
): Promise<{ ok: boolean; error?: string }> {
  const sql = await db();
  if (!sql) return { ok: false, error: "Database unavailable" };
  await sql`
    INSERT INTO completion_records (id, entity_type, entity_id, action, notes, override_reason, actor_id, created_at)
    VALUES (${newId()}, ${entityType}, ${entityId}, ${action}, ${notes}, ${overrideReason}, ${actor.id ?? null}, ${nowIso()})
  `;
  const next = action === "REOPENED" ? "REOPENED" : "COMPLETED";
  await setItemStatus(entityType, entityId, next, actor, notes);
  await audit({
    actorId: actor.id, actorEmail: actor.email,
    action: action === "REOPENED" ? "item.reopened" : action === "OVERRIDE_COMPLETED" ? "completion.override" : "item.completed",
    entity: entityType, entityId,
    metadata: { notes, overrideReason },
  });
  return { ok: true };
}

export async function listCompletions(
  entityType: string,
  entityId: string,
): Promise<CompletionRecord[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql`SELECT * FROM completion_records WHERE entity_type=${entityType} AND entity_id=${entityId} ORDER BY created_at DESC`;
  return (rows as Row[]).map((r) => ({
    id: String(r.id),
    entityType: String(r.entity_type),
    entityId: String(r.entity_id),
    action: r.action as CompletionRecord["action"],
    notes: String(r.notes ?? ""),
    overrideReason: String(r.override_reason ?? ""),
    actorId: (r.actor_id as string) ?? null,
    createdAt: String(r.created_at),
  }));
}

/* ---------------- comments / audit / users ---------------- */

export async function addComment(
  entityType: string,
  entityId: string,
  body: string,
  actor: { id?: string | null; email?: string },
): Promise<{ ok: boolean; error?: string }> {
  const sql = await db();
  if (!sql) return { ok: false, error: "Database unavailable" };
  await sql`INSERT INTO comments (id, entity_type, entity_id, body, author_id, created_at) VALUES (${newId()}, ${entityType}, ${entityId}, ${body}, ${actor.id ?? null}, ${nowIso()})`;
  return { ok: true };
}

export async function listComments(entityType: string, entityId: string) {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql`SELECT * FROM comments WHERE entity_type=${entityType} AND entity_id=${entityId} ORDER BY created_at ASC`;
  return (rows as Row[]).map((r) => ({
    id: String(r.id),
    body: String(r.body),
    authorId: (r.author_id as string) ?? null,
    createdAt: String(r.created_at),
  }));
}

export async function listAudit(limit = 100, offset = 0): Promise<AuditEntry[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
  return (rows as Row[]).map((r) => ({
    id: String(r.id),
    actorId: (r.actor_id as string) ?? null,
    actorEmail: String(r.actor_email ?? ""),
    action: String(r.action),
    entity: String(r.entity),
    entityId: String(r.entity_id ?? ""),
    metadata: (() => {
      try {
        return JSON.parse(String(r.metadata ?? "{}")) as Record<string, unknown>;
      } catch {
        return {};
      }
    })(),
    createdAt: String(r.created_at),
  }));
}

export async function listUsers(): Promise<TrackerUser[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql`SELECT * FROM users ORDER BY created_at ASC`;
  return (rows as Row[]).map(rowToUser);
}

/* ---------------- extra reads used by pages ---------------- */

export async function getManualProgress(
  entityType: string,
  entityId: string,
): Promise<number | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql`SELECT percent FROM manual_progress WHERE entity_type=${entityType} AND entity_id=${entityId} LIMIT 1`;
  return rows[0] ? Number(rows[0].percent) : null;
}

export async function listDeliverables(phaseNumber: string) {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql`SELECT * FROM deliverables WHERE phase_number=${phaseNumber} ORDER BY position`;
  return (rows as Row[]).map((r) => ({
    id: String(r.id),
    label: String(r.label),
    owner: String(r.owner ?? ""),
    status: String(r.status),
  }));
}

export async function getDbAvailable(): Promise<boolean> {
  return (await db()) !== null;
}
