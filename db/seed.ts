/**
 * Idempotent seed — workspace "Church Leadership LMS" + project + 10 phases.
 * Run: `npm run db:seed` (requires DATABASE_URL). Safe to re-run.
 * Until Supabase is wired, the UI renders data/reference.ts snapshot instead.
 */
import { ROADMAP_PHASES } from "../data/reference";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("[seed] DATABASE_URL not set — skipping (reference snapshot remains active).");
    console.log(`[seed] Would seed 1 workspace + 1 project + ${ROADMAP_PHASES.length} phases.`);
    return;
  }
  // Live seeding wires up here in Phase D once Supabase project exists.
  console.log("[seed] DATABASE_URL present — live seed not yet implemented (Phase D).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
