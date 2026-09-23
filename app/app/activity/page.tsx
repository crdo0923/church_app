import { AppShell } from "@/components/app/AppShell";
import { Card, CardHeading } from "@/components/app/Card";

export default function ActivityPage() {
  return (
    <AppShell title="Activity" subtitle="Reference timeline — immutable audit log ships with Phase J" activePath="/app/activity">
      <Card>
        <CardHeading>Recent activity (reference)</CardHeading>
        <ol className="mt-3 space-y-2 text-[13px]">
          <li className="rounded-md border border-border bg-background px-2.5 py-2"><span className="font-medium">Ricardo</span> initialized foundation track <span className="text-muted">· just now</span></li>
          <li className="rounded-md border border-border bg-background px-2.5 py-2"><span className="font-medium">System</span> seeded 10 roadmap phases <span className="text-muted">· today</span></li>
          <li className="rounded-md border border-border bg-background px-2.5 py-2"><span className="font-medium">Architect</span> accepted ADR-001…ADR-007 <span className="text-muted">· today</span></li>
        </ol>
      </Card>
    </AppShell>
  );
}
