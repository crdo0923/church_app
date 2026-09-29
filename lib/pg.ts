/**
 * Shared Postgres pool for the tracker (replaces node:sqlite).
 *
 * - One DATABASE_URL for local dev AND Vercel prod (tunnel/proxy for remote).
 * - `postgres` package is already a dependency — no new packages.
 * - Synchronous-style helpers are gone: all queries are async.
 * - DDL runs on first connect (idempotent CREATE TABLE IF NOT EXISTS).
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL ?? "";

let sql: ReturnType<typeof postgres> | null = null;
let schemaReady = false;
let initError: string | null = null;

export function dbStatus(): {
  configured: boolean;
  ready: boolean;
  error: string | null;
} {
  return {
    configured: DATABASE_URL.length > 0,
    ready: schemaReady,
    error: initError,
  };
}

const DDL = `
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

export function getSql() {
  if (!DATABASE_URL) return null;
  if (!sql) {
    sql = postgres(DATABASE_URL, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      // All tracker tables live in the roadmapchurch schema (shared DB).
      // `postgres` passes unknown options as connection parameters.
      ...({ search_path: "roadmapchurch, public" } as object),
    });
  }
  return sql;
}

export async function ensureSchema(): Promise<boolean> {
  const client = getSql();
  if (!client) {
    initError = "DATABASE_URL is not set";
    return false;
  }
  if (schemaReady) return true;
  try {
    // Dedicated schema isolates tracker tables from other apps sharing the DB.
    await client.unsafe(`CREATE SCHEMA IF NOT EXISTS roadmapchurch`);
    await client.unsafe(`SET search_path TO roadmapchurch, public`);
    // Split multi-statement DDL: Neon pooler chokes on multi-command unsafe().
    const statements = DDL.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await client.unsafe(stmt);
    }
    await client`
      INSERT INTO project_state (id, project_status, current_phase_number, overall_progress, progress_source, current_focus, blocker_note, updated_at)
      VALUES ('singleton','PLANNING','01',0,'CALCULATED','','',${new Date().toISOString()})
      ON CONFLICT (id) DO NOTHING
    `;
    schemaReady = true;
    initError = null;
    return true;
  } catch (err) {
    initError = err instanceof Error ? err.message : String(err);
    return false;
  }
}
