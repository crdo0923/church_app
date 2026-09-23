import { AppShell } from "@/components/app/AppShell";
import { Card, CardHeading } from "@/components/app/Card";

export default function DevOpsPage() {
  return (
    <AppShell title="DevOps" subtitle="Reference — live deployment tracking ships with Phase I" activePath="/app/devops">
      <Card>
        <CardHeading>Topology (reference)</CardHeading>
        <p className="mt-2 font-mono text-xs leading-loose text-muted">
          Developer → GitHub (crdo0923/church_app) → CI → Vercel Preview → QA → https://roadmapchurch.crdo.site
          <br />Supabase: PostgreSQL + Auth + Storage · Sentry + Vercel Observability
        </p>
      </Card>
      <Card className="mt-3">
        <CardHeading>Environments</CardHeading>
        <p className="mt-2 text-[13px] text-foreground/80">LOCAL → DEVELOPMENT → PREVIEW (per-PR) → STAGING → PRODUCTION. Details in docs/environments.md.</p>
      </Card>
    </AppShell>
  );
}
