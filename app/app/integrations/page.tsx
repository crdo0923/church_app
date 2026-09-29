import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/app/Badge";
import { Card, CardHeading } from "@/components/app/Card";

const ROWS = [
  { provider: "GoHighLevel", note: "Planned LMS integration — specification tracked in Phase 07. No sync in this tracker." },
  { provider: "Google Workspace", note: "Planned LMS integration — specification only." },
  { provider: "Microsoft 365", note: "Planned LMS integration — specification only." },
  { provider: "Email / SMS", note: "Planned LMS notification channels — specification only." },
  { provider: "Payments", note: "Planned LMS enrollment billing — specification only." },
  { provider: "Video conferencing", note: "Planned LMS class delivery — specification only." },
];

export default async function IntegrationsPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <AppShell
      title="Integrations"
      subtitle="Planned LMS integrations — documented here, never connected here"
      activePath="/app/integrations"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin={user.role === "SUPER_ADMIN"}
    >
      <Card>
        <CardHeading>Provider list (planned)</CardHeading>
        <ul className="mt-3 space-y-2 text-[13px]">
          {ROWS.map((r) => (
            <li key={r.provider} className="rounded-md border border-border bg-background px-2.5 py-2">
              <p className="font-medium">{r.provider} <Badge tone="neutral">Planned</Badge></p>
              <p className="mt-0.5 text-xs text-muted">{r.note}</p>
            </li>
          ))}
        </ul>
      </Card>
    </AppShell>
  );
}
