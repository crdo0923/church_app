import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/app/Badge";
import { Card, CardHeading } from "@/components/app/Card";
import { ARCHITECTURE_LAYERS, ROADMAP_PHASES } from "@/data/reference";
import { progressPercent, weightedProjectProgress } from "@/lib/progress";
import { ArrowRight, Blocks, OctagonAlert, ShieldCheck } from "lucide-react";

const projectProgress = weightedProjectProgress(
  ROADMAP_PHASES.map((p) => ({ progress: progressPercent(p.done, p.total) })),
);

export default function OverviewPage() {
  return (
    <AppShell
      title="Church Leadership LMS"
      subtitle="Production Engineering Command Center · reference snapshot (live data lands with Supabase in Phase D)"
      activePath="/app/overview"
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Overall Progress", value: `${projectProgress}%` },
          { label: "Active Milestones", value: "3" },
          { label: "Completed Tasks", value: "5" },
          { label: "Open Blockers", value: "1" },
        ].map((kpi) => (
          <Card key={kpi.label} className="py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{kpi.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-navy-900">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <div className="flex items-center justify-between gap-2">
              <CardHeading>Current Phase — 01 Foundation &amp; Product Setup</CardHeading>
              <Badge tone="info">In Progress</Badge>
            </div>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-valuenow={42}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Current phase progress"
            >
              <div className="h-full w-[42%] rounded-full bg-accent" />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div><dt className="text-muted">Owner</dt><dd className="font-medium">Engineering</dd></div>
              <div><dt className="text-muted">Target</dt><dd className="font-medium">Oct 2026</dd></div>
              <div><dt className="text-muted">Next milestone</dt><dd className="font-medium">Auth foundation</dd></div>
              <div><dt className="text-muted">Release target</dt><dd className="font-medium">roadmapchurch.crdo.site</dd></div>
            </dl>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-2">
              <CardHeading>Roadmap Snapshot</CardHeading>
              <a href="/app/roadmap" className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                Open roadmap <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
            <ol className="mt-3 space-y-1.5">
              {ROADMAP_PHASES.map((phase) => (
                <li key={phase.number}>
                  <a
                    href="/app/roadmap"
                    className="flex items-center gap-3 rounded-md border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-background"
                  >
                    <span className="w-6 shrink-0 font-mono text-xs text-muted">{phase.number}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{phase.name}</span>
                    <span className="hidden font-mono text-xs text-muted sm:inline">
                      {progressPercent(phase.done, phase.total)}%
                    </span>
                    <Badge tone={phase.status === "IN PROGRESS" ? "info" : phase.status === "READY" ? "success" : "neutral"}>
                      {phase.status}
                    </Badge>
                  </a>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <OctagonAlert className="h-4 w-4 text-danger" aria-hidden />
              <CardHeading>Active Blockers</CardHeading>
            </div>
            <div className="mt-3 rounded-md border border-danger/20 bg-danger-soft/40 p-3 text-[13px]">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">GoHighLevel API credentials</p>
                <Badge tone="danger">Blocked</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">Owner: Integration Team · Impact: enrollment workflow (Phase 07)</p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2">
              <Blocks className="h-4 w-4 text-arch" aria-hidden />
              <CardHeading>Architecture at a glance</CardHeading>
            </div>
            <ol className="mt-3 space-y-2 text-xs">
              {ARCHITECTURE_LAYERS.map((layer) => (
                <li key={layer.name} className="rounded-md border border-border bg-background px-2.5 py-2">
                  <p className="font-semibold text-navy-900">{layer.name}</p>
                  <p className="mt-0.5 text-muted">{layer.items.join(" · ")}</p>
                </li>
              ))}
            </ol>
          </Card>
          <Card>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" aria-hidden />
              <CardHeading>Deployment topology</CardHeading>
            </div>
            <p className="mt-2 font-mono text-xs leading-relaxed text-muted">
              GitHub (crdo0923/church_app) → CI → Vercel Preview → QA → roadmapchurch.crdo.site
              <br />Supabase: PostgreSQL + Auth + Storage
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
