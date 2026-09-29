/**
 * Tracker store — merges live SQLite state with the bundled seed snapshot.
 *
 * - Reads prefer SQLite when writable; ALWAYS fall back to the seed snapshot.
 * - Writes go to SQLite only (return { ok:false } when no DB — UI renders
 *   read-only messaging instead of fake interactivity).
 * - Item statuses, manual progress, criteria, deliverables, evidence,
 *   completion records, comments, project state/updates, and audit all persist.
 * - NOTHING here talks to GitHub/Vercel/LMS/external APIs. Humans update;
 *   the tracker records (§38, §53).
 */

import {
  getDb,
  nowIso,
  newId,
  hashToken,
  hashPassword,
  verifyPassword,
  newSessionToken,
} from "./tracker-db";
import { PHASES, PROJECT_SEED } from "../data/tracker-seed";
import type { DatabaseSync } from "node:sqlite";
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

function rowToUser(r: Record<string, unknown>): TrackerUser {
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

export function audit(
  db: DatabaseSync,
  entry: {
    actorId?: string | null;
    actorEmail?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  },
): void {
  db.prepare(
    "INSERT INTO audit_log (id, actor_id, actor_email, action, entity, entity_id, metadata, created_at) VALUES (?,?,?,?,?,?,?,?)",
  ).run(
    newId(),
    entry.actorId ?? null,
    entry.actorEmail ?? "",
    entry.action,
    entry.entity,
    entry.entityId ?? "",
    JSON.stringify(entry.metadata ?? {}),
    nowIso(),
  );
}

export function bootstrapNeeded(): boolean {
  const db = getDb();
  if (!db) return true; // no DB yet → setup screen explains bootstrap
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'SUPER_ADMIN'")
    .get() as { n: number } | undefined;
  return !row || Number(row.n) === 0;
}

/* ---------------- auth ---------------- */

export function findUserByEmail(email: string): TrackerUser | null {
  const db = getDb();
  if (!db) return null;
  const row = db
    .prepare("SELECT * FROM users WHERE lower(email) = lower(?)")
    .get(email) as Record<string, unknown> | undefined;
  return row ? rowToUser(row) : null;
}

export function findUserById(id: string): TrackerUser | null {
  const db = getDb();
  if (!db) return null;
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToUser(row) : null;
}

export function verifyUserPassword(userId: string, password: string): boolean {
  const db = getDb();
  if (!db) return false;
  const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(userId) as
    | { password_hash: string }
    | undefined;
  if (!row) return false;
  return verifyPassword(password, row.password_hash);
}

export function createSession(userId: string): Session | null {
  const db = getDb();
  if (!db) return null;
  const token = newSessionToken();
  const id = newId();
  const now = new Date();
  const expires = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14).toISOString();
  db.prepare(
    "INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at) VALUES (?,?,?,?,?)",
  ).run(id, userId, hashToken(token), now.toISOString(), expires);
  return { id, userId, token, expiresAt: expires };
}

export function getSessionUser(token: string | undefined | null): TrackerUser | null {
  if (!token) return null;
  const db = getDb();
  if (!db) return null;
  const row = db
    .prepare(
      "SELECT s.expires_at, u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?",
    )
    .get(hashToken(token)) as Record<string, unknown> | undefined;
  if (!row) return null;
  if (new Date(String(row.expires_at)).getTime() < Date.now()) return null;
  const user = rowToUser(row);
  if (user.status === "DISABLED" || user.status === "SUSPENDED") return null;
  return user;
}

export function destroySession(token: string): void {
  const db = getDb();
  if (!db) return;
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
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

export function createUser(input: CreateUserInput): { ok: boolean; user?: TrackerUser; error?: string } {
  const db = getDb();
  if (!db) return { ok: false, error: "Database unavailable" };
  const existing = db.prepare("SELECT id FROM users WHERE lower(email) = lower(?)").get(input.email);
  if (existing) return { ok: false, error: "Email already in use" };
  const id = newId();
  const now = nowIso();
  const password = input.password ?? newSessionToken().slice(0, 16);
  db.prepare(
    "INSERT INTO users (id, full_name, email, password_hash, role, status, notes, must_change_password, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
  ).run(
    id,
    input.fullName,
    input.email.toLowerCase(),
    hashPassword(password),
    input.role,
    input.status ?? "ACTIVE",
    input.notes ?? "",
    input.mustChangePassword ? 1 : 0,
    now,
    now,
  );
  audit(db, {
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    action: "user.created",
    entity: "user",
    entityId: id,
    metadata: { email: input.email.toLowerCase(), role: input.role },
  });
  return { ok: true, user: findUserById(id) ?? undefined };
}

/* ---------------- seed ---------------- */

const DEFAULT_CRITERION_STATUS = "INCOMPLETE";

export function seedSnapshot(): { seeded: boolean; reason: string } {
  const db = getDb();
  if (!db) return { seeded: false, reason: "Database unavailable — snapshot fallback active" };
  let inserted = 0;
  const run = (
    sql: string,
    ...params: (string | number | null)[]
  ) => db.prepare(sql).run(...params);

  for (const phase of PHASES) {
    const phaseId = `phase-${phase.number}`;
    for (const [i, d] of phase.deliverables.entries()) {
      const id = `${phaseId}-deliverable-${i}`;
      const exists = db.prepare("SELECT id FROM deliverables WHERE id = ?").get(id);
      if (!exists) {
        run(
          "INSERT INTO deliverables (id, phase_number, label, owner, status, notes, position, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
          id, phase.number, d.label, d.owner, "INCOMPLETE", "", i, nowIso(), nowIso(),
        );
        inserted++;
      }
    }
    for (const [i, a] of phase.acceptance.entries()) {
      const id = `${phaseId}-criterion-${i}`;
      const exists = db.prepare("SELECT id FROM criteria WHERE id = ?").get(id);
      if (!exists) {
        run(
          "INSERT INTO criteria (id, entity_type, entity_id, label, category, requirement, status, notes, position, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
          id, "phase", phaseId, a.label, a.category, "REQUIRED", DEFAULT_CRITERION_STATUS, "", i, nowIso(), nowIso(),
        );
        inserted++;
      }
    }
    for (const m of phase.milestones) {
      const exists = db.prepare("SELECT id FROM milestones WHERE id = ?").get(m.id);
      if (!exists) {
        run(
          "INSERT INTO milestones (id, phase_number, title, description, objective, owner, target_date, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
          m.id, phase.number, m.title, m.description, m.objective, m.owner, m.targetDate, nowIso(), nowIso(),
        );
        inserted++;
      }
    }
    for (const task of phase.tasks) {
      const exists = db.prepare("SELECT id FROM tasks WHERE id = ?").get(task.id);
      if (!exists) {
        run(
          "INSERT INTO tasks (id, phase_number, milestone_id, title, summary, description, owner, priority, target_date, dependencies, technical_notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
          task.id, phase.number, task.milestoneId, task.title, task.summary, task.description,
          task.owner, "MEDIUM", "", "", "", nowIso(), nowIso(),
        );
        inserted++;
      }
    }
  }
  // Ensure project_state reflects the human-authored snapshot on first seed only
  const updates = db.prepare("SELECT COUNT(*) AS n FROM project_updates").get() as { n: number };
  if (Number(updates.n) === 0) {
    run(
      "UPDATE project_state SET project_status=?, current_phase_number=?, overall_progress=?, progress_source=?, current_focus=?, blocker_note=?, updated_at=? WHERE id='singleton'",
      PROJECT_SEED.status, PROJECT_SEED.currentPhaseNumber, PROJECT_SEED.overallProgress,
      PROJECT_SEED.progressSource, PROJECT_SEED.currentFocus, PROJECT_SEED.blockerNote, nowIso(),
    );
  }
  return { seeded: inserted > 0, reason: inserted > 0 ? `Inserted ${inserted} seed rows` : "Seed already present" };
}

/* ---------------- project state ---------------- */

export function getProjectState(): ProjectState {
  const db = getDb();
  if (db) {
    const row = db.prepare("SELECT * FROM project_state WHERE id='singleton'").get() as
      | Record<string, unknown>
      | undefined;
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
  return {
    projectStatus: PROJECT_SEED.status,
    currentPhaseNumber: PROJECT_SEED.currentPhaseNumber,
    overallProgress: PROJECT_SEED.overallProgress,
    progressSource: PROJECT_SEED.progressSource,
    currentFocus: PROJECT_SEED.currentFocus,
    blockerNote: PROJECT_SEED.blockerNote,
    updatedBy: null,
    updatedAt: "",
  };
}

export function saveProjectUpdate(input: {
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
}): { ok: boolean; error?: string } {
  const db = getDb();
  if (!db) return { ok: false, error: "Database unavailable" };
  const id = newId();
  const now = nowIso();
  db.prepare(
    "INSERT INTO project_updates (id, project_status, current_phase_number, overall_progress, progress_source, current_focus, what_changed, whats_next, blocker_note, update_note, created_by, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
  ).run(
    id, input.projectStatus, input.currentPhaseNumber, input.overallProgress, input.progressSource,
    input.currentFocus, input.whatChanged, input.whatsNext, input.blockerNote, input.updateNote,
    input.actorId ?? null, now,
  );
  db.prepare(
    "UPDATE project_state SET project_status=?, current_phase_number=?, overall_progress=?, progress_source=?, current_focus=?, blocker_note=?, updated_by=?, updated_at=? WHERE id='singleton'",
  ).run(
    input.projectStatus, input.currentPhaseNumber, input.overallProgress, input.progressSource,
    input.currentFocus, input.blockerNote, input.actorId ?? null, now,
  );
  audit(db, {
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

export function listProjectUpdates(limit = 20): ProjectUpdate[] {
  const db = getDb();
  if (!db) return [];
  const rows = db
    .prepare("SELECT * FROM project_updates ORDER BY created_at DESC LIMIT ?")
    .all(limit) as Record<string, unknown>[];
  return rows.map((r) => ({
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

export function getItemStatus(entityType: string, entityId: string, fallback: string): string {
  const db = getDb();
  if (!db) return fallback;
  const row = db
    .prepare("SELECT status FROM item_status WHERE entity_type = ? AND entity_id = ?")
    .get(entityType, entityId) as { status: string } | undefined;
  return row ? row.status : fallback;
}

export function taskDoneCount(phaseNumber: string): { done: number; total: number } {
  const seedTasks = PHASES.find((p) => p.number === phaseNumber)?.tasks ?? [];
  if (seedTasks.length === 0) return { done: 0, total: 0 };
  const db = getDb();
  if (!db) return { done: 0, total: seedTasks.length };
  let done = 0;
  for (const t of seedTasks) {
    const s = getItemStatus("task", t.id, "BACKLOG");
    if (s === "DONE" || s === "COMPLETED") done++;
  }
  return { done, total: seedTasks.length };
}

export function listPhases(): PhaseView[] {
  return PHASES.map((p, idx) => {
    const phaseId = `phase-${p.number}`;
    const status =
      idx === 0
        ? getItemStatus("phase", phaseId, "IN_PROGRESS")
        : getItemStatus("phase", phaseId, "PLANNED");
    const { done, total } = taskDoneCount(p.number);
    const calc = total === 0 ? 0 : Math.round((done / total) * 100);
    const db = getDb();
    let manual: number | null = null;
    if (db) {
      const row = db
        .prepare("SELECT percent FROM manual_progress WHERE entity_type='phase' AND entity_id=?")
        .get(phaseId) as { percent: number } | undefined;
      if (row) manual = Number(row.percent);
    }
    // Phase 01 ships at the human-set 42% manual snapshot until someone updates it.
    if (manual === null && p.number === "01") manual = 42;
    const progress = manual ?? calc;
    return {
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
    };
  });
}

export function getPhase(number: string) {
  return PHASES.find((p) => p.number === number) ?? null;
}

/* ---------------- criteria / evidence / completion ---------------- */

export function listCriteria(entityType: string, entityId: string): Criterion[] {
  const db = getDb();
  if (!db) return [];
  const rows = db
    .prepare("SELECT * FROM criteria WHERE entity_type=? AND entity_id=? ORDER BY position, created_at")
    .all(entityType, entityId) as Record<string, unknown>[];
  return rows.map((r) => ({
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

export function addCriterion(input: {
  entityType: "phase" | "milestone" | "task";
  entityId: string;
  label: string;
  category: string;
  requirement: "REQUIRED" | "OPTIONAL" | "NOT_APPLICABLE";
  actorId?: string | null;
  actorEmail?: string;
}): { ok: boolean; error?: string } {
  const db = getDb();
  if (!db) return { ok: false, error: "Database unavailable" };
  const count = db
    .prepare("SELECT COUNT(*) AS n FROM criteria WHERE entity_type=? AND entity_id=?")
    .get(input.entityType, input.entityId) as { n: number };
  const id = newId();
  db.prepare(
    "INSERT INTO criteria (id, entity_type, entity_id, label, category, requirement, status, notes, position, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
  ).run(
    id, input.entityType, input.entityId, input.label, input.category, input.requirement,
    "INCOMPLETE", "", Number(count.n), nowIso(), nowIso(),
  );
  audit(db, { actorId: input.actorId, actorEmail: input.actorEmail, action: "criterion.added", entity: input.entityType, entityId: input.entityId, metadata: { label: input.label } });
  return { ok: true };
}

export function setCriterionStatus(
  id: string,
  status: "COMPLETE" | "INCOMPLETE" | "NOT_APPLICABLE",
  actor: { id?: string | null; email?: string },
): { ok: boolean; error?: string } {
  const db = getDb();
  if (!db) return { ok: false, error: "Database unavailable" };
  const row = db.prepare("SELECT * FROM criteria WHERE id=?").get(id) as Record<string, unknown> | undefined;
  if (!row) return { ok: false, error: "Criterion not found" };
  db.prepare("UPDATE criteria SET status=?, updated_at=? WHERE id=?").run(status, nowIso(), id);
  audit(db, { actorId: actor.id, actorEmail: actor.email, action: "criterion.updated", entity: String(row.entity_type), entityId: String(row.entity_id), metadata: { criterionId: id, status } });
  return { ok: true };
}

export function listEvidence(entityType: string, entityId: string): Evidence[] {
  const db = getDb();
  if (!db) return [];
  const rows = db
    .prepare("SELECT * FROM evidence WHERE entity_type=? AND entity_id=? ORDER BY created_at DESC")
    .all(entityType, entityId) as Record<string, unknown>[];
  return rows.map((r) => ({
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

export function addEvidence(input: {
  entityType: string;
  entityId: string;
  kind: string;
  label: string;
  url: string;
  text: string;
  actorId?: string | null;
  actorEmail?: string;
}): { ok: boolean; error?: string } {
  const db = getDb();
  if (!db) return { ok: false, error: "Database unavailable" };
  db.prepare(
    "INSERT INTO evidence (id, entity_type, entity_id, kind, label, url, text, created_by, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
  ).run(newId(), input.entityType, input.entityId, input.kind, input.label, input.url, input.text, input.actorId ?? null, nowIso());
  audit(db, { actorId: input.actorId, actorEmail: input.actorEmail, action: "evidence.added", entity: input.entityType, entityId: input.entityId, metadata: { label: input.label, kind: input.kind } });
  return { ok: true };
}

export function setItemStatus(
  entityType: "phase" | "milestone" | "task",
  entityId: string,
  status: string,
  actor: { id?: string | null; email?: string },
  note = "",
): { ok: boolean; error?: string } {
  const db = getDb();
  if (!db) return { ok: false, error: "Database unavailable" };
  const prev = getItemStatus(entityType, entityId, "");
  db.prepare(
    "INSERT INTO item_status (entity_type, entity_id, status, updated_by, updated_at) VALUES (?,?,?,?,?) ON CONFLICT(entity_type, entity_id) DO UPDATE SET status=excluded.status, updated_by=excluded.updated_by, updated_at=excluded.updated_at",
  ).run(entityType, entityId, status, actor.id ?? null, nowIso());
  audit(db, { actorId: actor.id, actorEmail: actor.email, action: "status.changed", entity: entityType, entityId, metadata: { from: prev, to: status, note } });
  return { ok: true };
}

export function recordCompletion(
  entityType: "phase" | "milestone" | "task",
  entityId: string,
  action: "COMPLETED" | "REOPENED" | "OVERRIDE_COMPLETED",
  notes: string,
  overrideReason: string,
  actor: { id?: string | null; email?: string },
): { ok: boolean; error?: string } {
  const db = getDb();
  if (!db) return { ok: false, error: "Database unavailable" };
  db.prepare(
    "INSERT INTO completion_records (id, entity_type, entity_id, action, notes, override_reason, actor_id, created_at) VALUES (?,?,?,?,?,?,?,?)",
  ).run(newId(), entityType, entityId, action, notes, overrideReason, actor.id ?? null, nowIso());
  const next = action === "REOPENED" ? "REOPENED" : "COMPLETED";
  setItemStatus(entityType, entityId, next, actor, notes);
  audit(db, {
    actorId: actor.id, actorEmail: actor.email,
    action: action === "REOPENED" ? "item.reopened" : action === "OVERRIDE_COMPLETED" ? "completion.override" : "item.completed",
    entity: entityType, entityId,
    metadata: { notes, overrideReason },
  });
  return { ok: true };
}

export function listCompletions(entityType: string, entityId: string): CompletionRecord[] {
  const db = getDb();
  if (!db) return [];
  const rows = db
    .prepare("SELECT * FROM completion_records WHERE entity_type=? AND entity_id=? ORDER BY created_at DESC")
    .all(entityType, entityId) as Record<string, unknown>[];
  return rows.map((r) => ({
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

export function addComment(
  entityType: string,
  entityId: string,
  body: string,
  actor: { id?: string | null; email?: string },
): { ok: boolean; error?: string } {
  const db = getDb();
  if (!db) return { ok: false, error: "Database unavailable" };
  db.prepare("INSERT INTO comments (id, entity_type, entity_id, body, author_id, created_at) VALUES (?,?,?,?,?,?)").run(
    newId(), entityType, entityId, body, actor.id ?? null, nowIso(),
  );
  return { ok: true };
}

export function listComments(entityType: string, entityId: string) {
  const db = getDb();
  if (!db) return [];
  return (db
    .prepare("SELECT * FROM comments WHERE entity_type=? AND entity_id=? ORDER BY created_at ASC")
    .all(entityType, entityId) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    body: String(r.body),
    authorId: (r.author_id as string) ?? null,
    createdAt: String(r.created_at),
  }));
}

export function listAudit(limit = 100, offset = 0): AuditEntry[] {
  const db = getDb();
  if (!db) return [];
  const rows = db
    .prepare("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(limit, offset) as Record<string, unknown>[];
  return rows.map((r) => ({
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

export function listUsers(): TrackerUser[] {
  const db = getDb();
  if (!db) return [];
  const rows = db.prepare("SELECT * FROM users ORDER BY created_at ASC").all() as Record<string, unknown>[];
  return rows.map(rowToUser);
}
