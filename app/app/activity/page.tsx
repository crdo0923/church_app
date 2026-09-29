import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { listAudit } from "@/lib/tracker-store";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/app/Badge";
import { Card, CardHeading } from "@/components/app/Card";

function describe(entry: { action: string; entity: string; entityId: string; metadata: Record<string, unknown> }): string {
  const m = entry.metadata;
  switch (entry.action) {
    case "project.updated":
      return `Project update — ${String(m.status ?? "")} · Phase ${String(m.phase ?? "")} · ${String(m.progress ?? "")}% (${String(m.source ?? "")})`;
    case "status.changed":
      return `${entry.entity} status: ${String(m.from ?? "—")} → ${String(m.to ?? "—")}${m.note ? ` — ${String(m.note)}` : ""}`;
    case "item.completed":
      return `${entry.entity} marked complete${m.notes ? ` — ${String(m.notes)}` : ""}`;
    case "completion.override":
      return `${entry.entity} completed by override — reason: ${String(m.overrideReason ?? "")}`;
    case "item.reopened":
      return `${entry.entity} reopened${m.notes ? ` — ${String(m.notes)}` : ""}`;
    case "criterion.added":
      return `Criterion added to ${entry.entity} — ${String(m.label ?? "")}`;
    case "criterion.updated":
      return `Criterion on ${entry.entity} → ${String(m.status ?? "")}`;
    case "evidence.added":
      return `Evidence on ${entry.entity} — ${String(m.label ?? "")} (${String(m.kind ?? "")})`;
    case "task.created":
      return `Task created — ${String(m.title ?? "")} (Phase ${String(m.phase ?? "")})`;
    case "progress.manual":
      return `${entry.entity} manual progress → ${String(m.percent ?? "")}%`;
    case "user.created":
      return `Account created — ${String(m.email ?? "")} (${String(m.role ?? "")})`;
    case "user.invited":
      return `Invitation sent — ${String(m.email ?? "")} (${String(m.role ?? "")})`;
    case "user.invite_accepted":
      return `Invitation accepted — ${String(m.role ?? "")}`;
    case "user.role_changed":
      return `Role: ${String(m.from ?? "")} → ${String(m.to ?? "")}`;
    case "user.status_changed":
      return `Status: ${String(m.from ?? "")} → ${String(m.to ?? "")}${m.reason ? ` — ${String(m.reason)}` : ""}`;
    case "user.password_reset":
      return "Access reset — temporary password issued";
    case "auth.login":
      return "Signed in";
    case "admin.setup":
      return "Initial administrator created";
    case "seed.run":
      return "Seed snapshot ensured";
    default:
      return `${entry.action} on ${entry.entity}`;
  }
}

export default async function ActivityPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const entries = await listAudit(60, 0);
  return (
    <AppShell
      title="Activity"
      subtitle="Every meaningful update — who, what, when"
      activePath="/app/activity"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin={user.role === "SUPER_ADMIN"}
    >
      <Card>
        <CardHeading>Project history</CardHeading>
        {entries.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted">
            No activity recorded yet. Run the seed and record the first project update — it will appear here.
          </p>
        ) : (
          <ol className="mt-3 space-y-2 text-[13px]">
            {entries.map((e) => (
              <li key={e.id} className="rounded-md border border-border bg-background px-2.5 py-2">
                <p>
                  <span className="font-medium">{e.actorEmail || "System"}</span> · {describe(e)}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                  <Badge tone="neutral">{e.action}</Badge>
                  {new Date(e.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </AppShell>
  );
}
