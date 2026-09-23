import { AppShell } from "@/components/app/AppShell";
import { Card, CardHeading } from "@/components/app/Card";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Reference — live workspace admin ships with Phase L (auth-gated)" activePath="/app/settings">
      <Card>
        <CardHeading>Sections (planned)</CardHeading>
        <p className="mt-2 text-[13px] text-foreground/80">Workspace · Members · Roles · Authentication · Notifications · Integrations · Environment · Security · Audit Logs · Project Settings.</p>
        <p className="mt-2 text-[11px] text-muted">All member/role changes are audited; viewers get read-only access enforced by RLS.</p>
      </Card>
    </AppShell>
  );
}
