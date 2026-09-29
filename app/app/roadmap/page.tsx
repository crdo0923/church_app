import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { listPhases } from "@/lib/tracker-store";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/app/Badge";
import { Card, CardHeading } from "@/components/app/Card";

export default async function RoadmapPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const phases = listPhases();

  return (
    <AppShell
      title="Project Roadmap"
      subtitle="10 phases · open a phase for its full brief"
      activePath="/app/roadmap"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin={user.role === "SUPER_ADMIN"}
    >
      <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {phases.map((phase) => (
          <li key={phase.number}>
            <a href={`/app/roadmap/${phase.number}`} className="block" aria-label={`Open phase ${phase.number} ${phase.name}`}>
              <Card className="transition-colors hover:border-accent/40">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[11px] text-muted">{phase.number}</p>
                    <h2 className="mt-0.5 text-sm font-semibold tracking-tight text-navy-900">{phase.name}</h2>
                  </div>
                  <Badge tone={phase.status === "IN_PROGRESS" ? "info" : phase.status === "COMPLETED" ? "success" : phase.status === "BLOCKED" ? "danger" : "neutral"}>
                    {phase.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={phase.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${phase.name} progress`}>
                  <div className="h-full rounded-full bg-accent" style={{ width: `${phase.progress}%` }} />
                </div>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  {phase.progress}% · {phase.progressSource === "MANUAL" ? "Manual update" : "Based on required items"}
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div><dt className="text-muted">Owner</dt><dd className="font-medium">{phase.owner}</dd></div>
                  <div><dt className="text-muted">Target</dt><dd className="font-medium">{phase.target}</dd></div>
                  <div><dt className="text-muted">Milestones</dt><dd className="font-medium">{phase.milestoneCount}</dd></div>
                  <div><dt className="text-muted">Open blockers</dt><dd className="font-medium">{phase.openBlockerCount}</dd></div>
                </dl>
              </Card>
            </a>
          </li>
        ))}
      </ol>

      <Card className="mt-4">
        <CardHeading>Order of work</CardHeading>
        <p className="mt-2 font-mono text-xs leading-loose text-muted">
          01 Foundation → 02 Core LMS &amp; Identity → 03 Church &amp; Faculty → 04 Students → 05 Learning → 06 Scheduling → 07 Integrations → 08 Reporting → 09 Security → 10 Production
        </p>
        <p className="mt-1 text-[11px] text-muted">Dependencies are tracked on each phase brief. Progress never completes a phase on its own — completion needs an explicit review.</p>
      </Card>
    </AppShell>
  );
}
