import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { dbStatus } from "@/lib/pg";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardHeading } from "@/components/app/Card";

export default async function DeploymentPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const db = dbStatus();
  return (
    <AppShell
      title="Deployment"
      subtitle="Where this tracker runs — not LMS production"
      activePath="/app/devops"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin={user.role === "SUPER_ADMIN"}
    >
      <Card>
        <CardHeading>This tracker</CardHeading>
        <dl className="mt-2 grid gap-2 text-[13px] sm:grid-cols-2">
          <div><dt className="text-muted">Live URL</dt><dd className="font-mono">roadmapchurch.crdo.site</dd></div>
          <div><dt className="text-muted">Source</dt><dd className="font-mono">crdo0923/church_app</dd></div>
          <div><dt className="text-muted">Runtime</dt><dd>Vercel · Next.js 16</dd></div>
          <div><dt className="text-muted">Tracker data</dt><dd className="font-mono">{db.ready ? `SQLite (${(db.configured ? "Postgres (DATABASE_URL)" : "not configured")})` : "Seed snapshot (set TRACKER_DB_PATH)"}</dd></div>
        </dl>
        <p className="mt-2 text-xs text-muted">
          The tracker database holds team accounts and roadmap content only. It never connects to LMS production data.
        </p>
      </Card>
    </AppShell>
  );
}
