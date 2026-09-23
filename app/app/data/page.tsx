import { AppShell } from "@/components/app/AppShell";
import { Card, CardHeading } from "@/components/app/Card";

export default function DataPage() {
  return (
    <AppShell title="Data" subtitle="Reference — live schema browser ships with Phase D" activePath="/app/data">
      <Card>
        <CardHeading>PostgreSQL model (reference)</CardHeading>
        <p className="mt-2 font-mono text-xs leading-loose text-muted">
          workspaces → workspace_members → projects → roadmap_phases → milestones → tasks (+ assignees, labels, dependencies) · risks · technical_decisions · architecture_components · technology_stack_items · integrations · environments → deployments · documents · comments · notifications · audit_logs (append-only)
        </p>
        <p className="mt-2 text-[13px] text-foreground/80">UUID PKs · created_at/updated_at everywhere · RLS on every table · full DDL contract in docs/database.md.</p>
      </Card>
    </AppShell>
  );
}
