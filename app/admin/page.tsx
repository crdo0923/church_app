import { requireSuperAdmin } from "@/lib/auth";
import { listUsers, listAudit } from "@/lib/tracker-store";
import { dbStatus } from "@/lib/tracker-db";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/app/Badge";
import { Card, CardHeading } from "@/components/app/Card";

export default async function AdminDashboard() {
  const user = await requireSuperAdmin();
  const users = listUsers();
  const audit = listAudit(8, 0);
  const db = dbStatus();
  const count = (fn: (u: (typeof users)[number]) => boolean) => users.filter(fn).length;
  const cards = [
    { label: "Total tracker users", value: String(users.length) },
    { label: "Active", value: String(count((u) => u.status === "ACTIVE")) },
    { label: "Invited", value: String(count((u) => u.status === "INVITED")) },
    { label: "Administrators", value: String(count((u) => u.role === "SUPER_ADMIN" || u.role === "ADMIN")) },
    { label: "Editors", value: String(count((u) => u.role === "EDITOR")) },
    { label: "Viewers", value: String(count((u) => u.role === "VIEWER")) },
  ];
  return (
    <AppShell
      title="Administration"
      subtitle="Manage roadmap tracker access — not LMS administration"
      activePath="/admin"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{c.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-navy-900">{c.value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeading>Recent account & project activity</CardHeading>
          {audit.length === 0 ? (
            <p className="mt-2 text-[13px] text-muted">No activity yet.</p>
          ) : (
            <ol className="mt-3 space-y-2 text-[13px]">
              {audit.map((e) => (
                <li key={e.id} className="rounded-md border border-border bg-background px-2.5 py-2">
                  <p><span className="font-medium">{e.actorEmail || "System"}</span> · {e.action} · {e.entity}</p>
                  <p className="text-[11px] text-muted">{new Date(e.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/admin/users" className="inline-flex min-h-[44px] items-center rounded-md bg-navy-900 px-3 text-[13px] font-medium text-white">Manage users</a>
            <a href="/admin/audit" className="inline-flex min-h-[44px] items-center rounded-md border border-border px-3 text-[13px] font-medium">Full audit log</a>
          </div>
        </Card>
        <Card>
          <CardHeading>Tracker status</CardHeading>
          <p className="mt-2 text-xs">
            <Badge tone={db.writable ? "success" : "warning"}>{db.writable ? "Database writable" : "Snapshot mode"}</Badge>
          </p>
          <p className="mt-2 font-mono text-[11px] text-muted">{db.writable ? db.path : (db.error ?? "Set TRACKER_DB_PATH")}</p>
          <p className="mt-2 text-xs text-muted">Tracker accounts are independent from the Church Leadership LMS.</p>
        </Card>
      </div>
    </AppShell>
  );
}
