import { requireSuperAdmin } from "@/lib/auth";
import { listAudit } from "@/lib/tracker-store";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/app/Badge";
import { Card, CardHeading } from "@/components/app/Card";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireSuperAdmin();
  const { page } = await searchParams;
  const pageNum = Math.max(0, Number.parseInt(page ?? "0", 10) || 0);
  const limit = 50;
  const entries = await listAudit(limit, pageNum * limit);
  return (
    <AppShell
      title="Audit Log"
      subtitle="Append-only — account changes, roadmap changes, completion decisions"
      activePath="/admin/audit"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin
    >
      <Card>
        <CardHeading>Entries (newest first)</CardHeading>
        {entries.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted">No entries on this page.</p>
        ) : (
          <ol className="mt-3 space-y-2 text-[13px]">
            {entries.map((e) => (
              <li key={e.id} className="rounded-md border border-border bg-background px-2.5 py-2">
                <p><span className="font-medium">{e.actorEmail || "System"}</span> · {e.action} · {e.entity}{e.entityId ? ` · ${e.entityId.slice(0, 8)}` : ""}</p>
                <p className="mt-0.5 break-all font-mono text-[11px] text-muted">{JSON.stringify(e.metadata)}</p>
                <p className="mt-0.5 text-[11px] text-muted"><Badge tone="neutral">{new Date(e.createdAt).toLocaleString()}</Badge></p>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-3 flex gap-2 text-[13px]">
          {pageNum > 0 ? <a className="rounded-md border border-border px-3 py-2" href={`/admin/audit?page=${pageNum - 1}`}>← Newer</a> : null}
          {entries.length === limit ? <a className="rounded-md border border-border px-3 py-2" href={`/admin/audit?page=${pageNum + 1}`}>Older →</a> : null}
        </div>
      </Card>
    </AppShell>
  );
}
