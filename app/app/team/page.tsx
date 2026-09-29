import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { listUsers } from "@/lib/tracker-store";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/app/Badge";
import { Card } from "@/components/app/Card";

export default async function TeamPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const allUsers = await listUsers();
  const users = allUsers.filter((u) => u.status === "ACTIVE");
  return (
    <AppShell
      title="Team"
      subtitle="Who is responsible — visibility, never rankings"
      activePath="/app/team"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin={user.role === "SUPER_ADMIN"}
    >
      {users.length === 0 ? (
        <Card>
          <p className="text-[13px] text-muted">
            No tracker accounts yet. The Super Admin creates accounts from Administration → Users.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {users.map((m) => (
            <Card key={m.id}>
              <div className="flex items-center gap-3">
                <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">
                  {m.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy-900">{m.fullName}</p>
                  <p className="text-xs text-muted">{m.email}</p>
                </div>
                <span className="ml-auto"><Badge tone={m.role === "VIEWER" ? "neutral" : "info"}>{m.role.replace(/_/g, " ")}</Badge></span>
              </div>
              {m.notes ? <p className="mt-2.5 text-xs text-foreground/80">{m.notes}</p> : null}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
