/**
 * E2E bootstrap helper (NOT a route): creates the Super Admin directly in
 * the SQLite file at TRACKER_DB_PATH so Playwright can start from a known state.
 * Run: TRACKER_DB_PATH=/tmp/... SUPER_ADMIN_BOOTSTRAP_PASSWORD=460111 npx tsx scripts/e2e-bootstrap.ts
 */
import { getDb, newId, nowIso, hashPassword } from "../lib/tracker-db";
import { seedSnapshot, audit } from "../lib/tracker-store";

const db = getDb();
if (!db) {
  console.error("Database unavailable");
  process.exit(1);
}
const seed = seedSnapshot();
console.log("seed:", seed.reason);
const existing = db.prepare("SELECT id FROM users WHERE email='admin@tracker.local'").get();
if (!existing) {
  const id = newId();
  const now = nowIso();
  db.prepare(
    "INSERT INTO users (id, full_name, email, password_hash, role, status, notes, must_change_password, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
  ).run(id, "Ada Admin", "admin@tracker.local", hashPassword("Admin_password_123"), "SUPER_ADMIN", "ACTIVE", "E2E bootstrap", 0, now, now);
  audit(db, { actorId: id, actorEmail: "admin@tracker.local", action: "admin.setup", entity: "user", entityId: id });
  console.log("admin created: admin@tracker.local");
} else {
  console.log("admin exists");
}
