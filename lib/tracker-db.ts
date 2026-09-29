/**
 * Embedded tracker database (SQLite via node:sqlite).
 *
 * Team-only account store + human-maintained roadmap data.
 * - Tracker accounts are INDEPENDENT from any LMS accounts (§33).
 * - Roadmap progress is set by humans; nothing external auto-completes items (§38).
 * - SQLite file lives OUTSIDE version control: TRACKER_DB_PATH or
 *   .data/tracker.db (gitignored). The file persists on the team server /
 *   single host; for Vercel serverless the file is ephemeral, so the module
 *   falls back to an in-memory database (`:memory:`) when the file cannot be
 *   created — reads ALWAYS fall back to the bundled seed snapshot on top of
 *   that, so the app never 503s, and writes work for the lifetime of the
 *   serverless instance.
 */

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

const DB_PATH =
  process.env.TRACKER_DB_PATH ??
  path.join(process.cwd(), ".data", "tracker.db");

export const SCHEMA_VERSION = 3;

const DDL = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN','ADMIN','EDITOR','VIEWER')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED','INVITED','DISABLED')),
  notes TEXT NOT NULL DEFAULT '',
  must_change_password INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN','EDITOR','VIEWER')),
  notes TEXT NOT NULL DEFAULT '',
  token_hash TEXT NOT NULL UNIQUE,
  created_by TEXT,
  created_at TEXT NOT NULL,
  accepted_at TEXT,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS project_state (
  id TEXT PRIMARY KEY CHECK (id = 'singleton'),
  project_status TEXT NOT NULL DEFAULT 'PLANNING',
  current_phase_number TEXT NOT NULL DEFAULT '01',
  overall_progress INTEGER NOT NULL DEFAULT 0,
  progress_source TEXT NOT NULL DEFAULT 'MANUAL',
  current_focus TEXT NOT NULL DEFAULT '',
  blocker_note TEXT NOT NULL DEFAULT '',
  updated_by TEXT,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS project_updates (
  id TEXT PRIMARY KEY,
  project_status TEXT NOT NULL,
  current_phase_number TEXT NOT NULL,
  overall_progress INTEGER NOT NULL,
  progress_source TEXT NOT NULL,
  current_focus TEXT NOT NULL DEFAULT '',
  what_changed TEXT NOT NULL DEFAULT '',
  whats_next TEXT NOT NULL DEFAULT '',
  blocker_note TEXT NOT NULL DEFAULT '',
  update_note TEXT NOT NULL DEFAULT '',
  created_by TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS criteria (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('phase','milestone','task')),
  entity_id TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'FUNCTIONAL',
  requirement TEXT NOT NULL DEFAULT 'REQUIRED',
  status TEXT NOT NULL DEFAULT 'INCOMPLETE',
  notes TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('phase','milestone','task')),
  entity_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  created_by TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS completion_records (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('phase','milestone','task')),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('COMPLETED','REOPENED','OVERRIDE_COMPLETED')),
  notes TEXT NOT NULL DEFAULT '',
  override_reason TEXT NOT NULL DEFAULT '',
  actor_id TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS item_status (
  entity_type TEXT NOT NULL CHECK (entity_type IN ('phase','milestone','task')),
  entity_id TEXT NOT NULL,
  status TEXT NOT NULL,
  updated_by TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (entity_type, entity_id)
);
CREATE TABLE IF NOT EXISTS manual_progress (
  entity_type TEXT NOT NULL CHECK (entity_type IN ('phase','milestone')),
  entity_id TEXT NOT NULL,
  percent INTEGER NOT NULL,
  updated_by TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (entity_type, entity_id)
);
CREATE TABLE IF NOT EXISTS deliverables (
  id TEXT PRIMARY KEY,
  phase_number TEXT NOT NULL,
  label TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'INCOMPLETE',
  notes TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  phase_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  objective TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  target_date TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  phase_number TEXT NOT NULL,
  milestone_id TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  target_date TEXT NOT NULL DEFAULT '',
  dependencies TEXT NOT NULL DEFAULT '',
  technical_notes TEXT NOT NULL DEFAULT '',
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  body TEXT NOT NULL,
  author_id TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  actor_email TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL DEFAULT '',
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_criteria_entity ON criteria(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_evidence_entity ON evidence(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`;

let db: DatabaseSync | null = null;
let dbWritable = false;
let dbInitError: string | null = null;

export function dbStatus(): {
  writable: boolean;
  path: string;
  error: string | null;
} {
  return { writable: dbWritable, path: DB_PATH, error: dbInitError };
}

export function getDb(): DatabaseSync | null {
  if (db) return dbWritable ? db : null;
  // Try the file path first; fall back to :memory: (serverless-safe).
  const candidates = DB_PATH === ":memory:" ? [":memory:"] : [DB_PATH, ":memory:"];
  let lastError: string | null = null;
  for (const candidate of candidates) {
    try {
      if (candidate !== ":memory:") {
        fs.mkdirSync(path.dirname(candidate), { recursive: true });
      }
      const handle = new DatabaseSync(candidate);
      handle.exec(DDL);
      const row = handle
        .prepare("SELECT value FROM meta WHERE key = 'schema_version'")
        .get() as { value: string } | undefined;
      if (!row) {
        handle
          .prepare("INSERT INTO meta (key, value) VALUES ('schema_version', ?)")
          .run(String(SCHEMA_VERSION));
      }
      // Ensure singleton project_state row exists
      const existing = handle
        .prepare("SELECT id FROM project_state WHERE id = 'singleton'")
        .get();
      if (!existing) {
        handle
          .prepare(
            "INSERT INTO project_state (id, project_status, current_phase_number, overall_progress, progress_source, current_focus, blocker_note, updated_at) VALUES ('singleton','PLANNING','01',0,'CALCULATED','','',?)",
          )
          .run(new Date().toISOString());
      }
      db = handle;
      dbWritable = true;
      dbInitError = candidate === ":memory:" ? "file unavailable — using in-memory database" : null;
      return db;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      continue;
    }
  }
  dbInitError = lastError;
  db = null;
  dbWritable = false;
  return null;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(): string {
  return crypto.randomUUID();
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** scrypt password hash in Modular Crypt–ish envelope; no new deps. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return `scrypt$N=16384$r=8$p=1$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split("$");
    if (parts[0] !== "scrypt" || parts.length !== 5) return false;
    const salt = Buffer.from(parts[3], "hex");
    const expected = Buffer.from(parts[4], "hex");
    const derived = crypto.scryptSync(password, salt, 64);
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function newSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
