/**
 * E2E bootstrap helper (NOT a route): creates the Super Admin directly in
 * Postgres at DATABASE_URL so Playwright can start from a known state.
 * Run: DATABASE_URL=... npx tsx scripts/e2e-bootstrap.ts
 */
import { ensureSchema, getSql } from "../lib/pg";
import { newId, nowIso, hashPassword } from "../lib/tracker-db";
import { seedSnapshot, audit } from "../lib/tracker-store";

async function main() {
  if (!(await ensureSchema())) {
    console.error("Database unavailable");
    process.exit(1);
  }
  const sql = getSql();
  if (!sql) {
    console.error("Database unavailable");
    process.exit(1);
  }
  const seed = await seedSnapshot();
  console.log("seed:", seed.reason);
  const existing = await sql`SELECT id FROM users WHERE email='admin@tracker.local' LIMIT 1`;
  if (!existing[0]) {
    const id = newId();
    const now = nowIso();
    await sql`
      INSERT INTO users (id, full_name, email, password_hash, role, status, notes, must_change_password, created_at, updated_at)
      VALUES (${id}, 'Ada Admin', 'admin@tracker.local', ${hashPassword("Admin_password_123")}, 'SUPER_ADMIN', 'ACTIVE', 'E2E bootstrap', 0, ${now}, ${now})
    `;
    await audit({ actorId: id, actorEmail: "admin@tracker.local", action: "admin.setup", entity: "user", entityId: id });
    console.log("admin created: admin@tracker.local");
  } else {
    console.log("admin exists");
  }
  process.exit(0);
}

main();
