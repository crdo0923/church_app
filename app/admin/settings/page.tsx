import { requireSuperAdmin } from "@/lib/auth";
import { dbStatus } from "@/lib/pg";
import { seedSnapshot } from "@/lib/tracker-store";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/app/Badge";
import { Card, CardHeading } from "@/components/app/Card";
import { SeedButton } from "@/components/app/SeedButton";

export default async function AdminSettingsPage() {
  const user = await requireSuperAdmin();
  const db = dbStatus();
  const seed = await seedSnapshot();
  return (
    <AppShell
      title="Tracker Settings"
      subtitle="Environment, data, and access rules for this tracker"
      activePath="/admin/settings"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeading>Data & seed</CardHeading>
          <p className="mt-2 text-xs">
            <Badge tone={db.ready ? "success" : "warning"}>{db.ready ? "Database writable" : "Snapshot mode"}</Badge>
          </p>
          <p className="mt-2 font-mono text-[11px] text-muted">{db.ready ? (db.configured ? "Postgres (DATABASE_URL)" : "not configured") : (db.error ?? "Set TRACKER_DB_PATH")}</p>
          <p className="mt-2 text-[13px]">Seed check: {seed.reason}. Seeding only adds missing rows — it never overwrites human updates.</p>
          <div className="mt-2"><SeedButton /></div>
        </Card>
        <Card>
          <CardHeading>Access rules</CardHeading>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px]">
            <li>Super Admin: manage tracker accounts, settings, all roadmap data, audit logs.</li>
            <li>Admin: manage roadmap and users when permitted.</li>
            <li>Editor: update roadmap content, statuses, tasks, notes, evidence.</li>
            <li>Viewer: read-only. Edit routes deny viewers on the server.</li>
          </ul>
          <p className="mt-2 text-xs text-muted">Bootstrap password: server environment only (SUPER_ADMIN_BOOTSTRAP_PASSWORD). Change the Super Admin password after setup; the bootstrap value is temporary.</p>
        </Card>
      </div>
    </AppShell>
  );
}
