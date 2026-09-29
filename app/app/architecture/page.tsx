import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardHeading } from "@/components/app/Card";

export default async function PlannedArchitecturePage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const layers = [
    { name: "People & access (planned LMS)", items: ["Super Admin", "Admin", "Faculty", "Student", "Church Leader", "Guest"] },
    { name: "Web application (planned)", items: ["Dashboard", "Churches", "Faculty", "Courses", "Scheduling", "Reports"] },
    { name: "Integration & automation (planned)", items: ["API requirements", "Webhook specs", "Workflow definitions", "Retry rules"] },
    { name: "Data (planned)", items: ["Application database", "File storage", "Backups", "Hosting notes"] },
    { name: "External systems (planned, docs only)", items: ["GoHighLevel", "Google Workspace", "Microsoft 365", "Email/SMS", "Payments", "Video"] },
    { name: "Security & compliance (planned)", items: ["RBAC notes", "Auth requirements", "Audit requirements", "Encryption notes"] },
  ];
  return (
    <AppShell
      title="Planned Architecture"
      subtitle="What the LMS is planned to look like — reference documentation, not a live system"
      activePath="/app/architecture"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin={user.role === "SUPER_ADMIN"}
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {layers.map((layer, i) => (
          <div key={layer.name}>
            <Card>
              <p className="font-mono text-[11px] text-muted">LAYER {String(i + 1).padStart(2, "0")}</p>
              <CardHeading>{layer.name}</CardHeading>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {layer.items.map((item) => (
                  <li key={item} className="rounded border border-border bg-background px-2 py-1 text-xs">{item}</li>
                ))}
              </ul>
            </Card>
            {i < layers.length - 1 ? <p aria-hidden className="py-1 text-center font-mono text-sm text-muted">↓</p> : null}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
