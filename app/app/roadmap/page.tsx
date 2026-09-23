import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/app/Badge";
import { Card, CardHeading } from "@/components/app/Card";
import { ROADMAP_PHASES } from "@/data/reference";
import { progressPercent } from "@/lib/progress";

const toneFor = (status: string) =>
  status === "IN PROGRESS" ? "info" : status === "READY" ? "success" : status === "BLOCKED" ? "danger" : status === "AT RISK" ? "warning" : "neutral";

export default function RoadmapPage() {
  return (
    <AppShell
      title="Technical Build Roadmap"
      subtitle="Architecture → Development → Integration → Security → Production · reference snapshot (live CRUD lands with Supabase in Phase D)"
      activePath="/app/roadmap"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md border border-border bg-white px-2.5 py-1.5 text-muted">Add Phase · Add Milestone · Add Task — enabled after Phase D persistence</span>
        <span className="rounded-md border border-border bg-white px-2.5 py-1.5 text-muted">Filter · Search · Export — static reference</span>
      </div>

      <ol className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {ROADMAP_PHASES.map((phase) => (
          <li key={phase.number}>
            <Card>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-[11px] text-muted">{phase.number}</p>
                  <h2 className="mt-0.5 text-sm font-semibold tracking-tight text-navy-900">{phase.name}</h2>
                </div>
                <Badge tone={toneFor(phase.status) as "info" | "success" | "danger" | "warning" | "neutral"}>{phase.status}</Badge>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={progressPercent(phase.done, phase.total)} aria-valuemin={0} aria-valuemax={100} aria-label={`${phase.name} progress`}>
                <div className="h-full rounded-full bg-accent" style={{ width: `${progressPercent(phase.done, phase.total)}%` }} />
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div><dt className="text-muted">Progress</dt><dd className="font-mono font-medium">{phase.done}/{phase.total} · {progressPercent(phase.done, phase.total)}%</dd></div>
                <div><dt className="text-muted">Owner</dt><dd className="font-medium">{phase.owner}</dd></div>
                <div><dt className="text-muted">Target</dt><dd className="font-medium">{phase.target}</dd></div>
              </dl>
              <p className="mt-3 border-t border-border pt-2.5 text-[11px] text-muted">
                Phase detail (milestones · tasks · risks · blockers · dependencies) opens here after Phase F/G persistence.
              </p>
            </Card>
          </li>
        ))}
      </ol>

      <Card className="mt-4">
        <CardHeading>Dependency chain (reference)</CardHeading>
        <p className="mt-2 font-mono text-xs leading-loose text-muted">
          01 Foundation → 02 Core LMS &amp; Identity → 03 Church &amp; Faculty → 04 Students → 05 Learning → 06 Scheduling → 07 Integrations → 08 Reporting → 09 Security → 10 Production
        </p>
        <p className="mt-1 text-[11px] text-muted">Interactive React Flow graph lands in Phase H; stored as task/phase/milestone edges in Postgres.</p>
      </Card>
    </AppShell>
  );
}
