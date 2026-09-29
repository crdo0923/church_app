import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Regression guard for production ERROR 1243805687:
 * on the shared Neon DB, public.users/sessions/tasks belong to multiply-talents
 * (camelCase columns). Any unqualified tracker table reference in server SQL
 * risks resolving to those tables and crashing. Every reference must be
 * roadmapchurch-qualified.
 */
const TABLES = [
  "audit_log",
  "comments",
  "completion_records",
  "criteria",
  "deliverables",
  "evidence",
  "invites",
  "item_status",
  "manual_progress",
  "meta",
  "milestones",
  "project_state",
  "project_updates",
  "sessions",
  "tasks",
  "users",
];

const SCAN_FILES = [
  "lib/tracker-store.ts",
  "lib/pg.ts",
  "app/api/actions/[resource]/route.ts",
  "app/api/auth/[action]/route.ts",
  "scripts/e2e-bootstrap.ts",
];

describe("schema isolation", () => {
  it("has no unqualified tracker table references in server SQL", () => {
    const root = path.resolve(__dirname, "..");
    const violations: string[] = [];
    for (const rel of SCAN_FILES) {
      const text = fs.readFileSync(path.join(root, rel), "utf8");
      const re = /\b(FROM|JOIN|INTO|UPDATE)\s+([a-z_][a-z0-9_]*)/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        const [, kw, tbl] = m;
        const low = tbl.toLowerCase();
        if (TABLES.includes(low)) {
          // Allow qualified roadmapchurch.<table>
          const before = text.slice(Math.max(0, m.index - 20), m.index);
          void before;
          violations.push(`${rel}: ${kw} ${tbl}`);
        }
      }
    }
    // Filter: keep only genuinely unqualified (not preceded by roadmapchurch.)
    const root2 = root;
    const real: string[] = [];
    for (const rel of SCAN_FILES) {
      const text = fs.readFileSync(path.join(root2, rel), "utf8");
      const re = /\b(FROM|JOIN|INTO|UPDATE)\s+(?!roadmapchurch\.)([a-z_][a-z0-9_]*)/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        if (TABLES.includes(m[2].toLowerCase())) real.push(`${rel}: ${m[1]} ${m[2]}`);
      }
    }
    void violations;
    expect(real).toEqual([]);
  });

  it("DDL creates tables inside the roadmapchurch schema", () => {
    const text = fs.readFileSync(path.resolve(__dirname, "../lib/pg.ts"), "utf8");
    expect(text).toContain("CREATE SCHEMA IF NOT EXISTS ${TRACKER_SCHEMA}");
    expect(text).toContain("CREATE TABLE IF NOT EXISTS roadmapchurch.users");
    expect(text).toContain("REFERENCES roadmapchurch.users(id)");
    expect(text).not.toMatch(/await client\.unsafe\(`SET search_path/);
  });
});
