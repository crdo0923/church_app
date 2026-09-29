import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { listPhases, getProjectState, listProjectUpdates } from "@/lib/tracker-store";
import { displayProgress } from "@/lib/completion";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/app/Badge";
import { Card, CardHeading } from "@/components/app/Card";
import { ArrowRight, OctagonAlert } from "lucide-react";

export default async function OverviewPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const phases = await listPhases();
  const state = await getProjectState();
  const current = phases.find((p) => p.number === state.currentPhaseNumber) ?? phases[0];
  const progress = displayProgress({
    calculatedPercent: current?.progress ?? 0,
    manualPercent: current?.progressSource === "MANUAL" ? (current?.progress ?? null) : null,
  });
  const updates = await listProjectUpdates(5);
  const canEdit = user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "EDITOR";

  return (
    <AppShell
      title="Church Leadership LMS"
      subtitle="Project Roadmap · human-maintained — nothing here syncs automatically"
      activePath="/app/overview"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin={user.role === "SUPER_ADMIN"}
      action={
        canEdit ? (
          <a
            href="/app/overview/update"
            className="inline-flex min-h-[44px] items-center rounded-md bg-navy-900 px-4 text-[13px] font-medium text-white"
          >
            Update project
          </a>
        ) : undefined
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Project status", value: state.projectStatus.replace(/_/g, " ") },
          { label: "Overall progress", value: `${state.overallProgress}%` },
          { label: "Current phase", value: state.currentPhaseNumber },
          { label: "Open blockers", value: String(phases.reduce((n, p) => n + p.openBlockerCount, 0)) },
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardHeading>
                Current phase — {current?.number} {current?.name}
              </CardHeading>
              <Badge tone={current?.status === "IN_PROGRESS" ? "info" : current?.status === "COMPLETED" ? "success" : "neutral"}>
                {(current?.status ?? "").replace(/_/g, " ")}
              </Badge>
            </div>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-valuenow={progress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Current phase progress"
            >
              <div className="h-full rounded-full bg-accent" style={{ width: `${progress.percent}%` }} />
            </div>
            <p className="mt-1 font-mono text-[11px] text-muted">
              {progress.percent}% · {progress.basis}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div><dt className="text-muted">Owner</dt><dd className="font-medium">{current?.owner}</dd></div>
              <div><dt className="text-muted">Target</dt><dd className="font-medium">{current?.target}</dd></div>
              <div><dt className="text-muted">Current focus</dt><dd className="font-medium">{state.currentFocus || "—"}</dd></div>
              <div><dt className="text-muted">Last updated</dt><dd className="font-medium">{state.updatedAt ? new Date(state.updatedAt).toLocaleString() : "seed snapshot"}</dd></div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/app/roadmap/${current?.number}`} className="inline-flex min-h-[44px] items-center gap-1 rounded-md border border-border px-3 text-[13px] font-medium">
                Open phase brief <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-2">
              <CardHeading>What&apos;s next</CardHeading>
              <Link href="/app/roadmap" className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                Open roadmap <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            <ol className="mt-3 space-y-1.5">
              {phases.map((phase) => (
                <li key={phase.number}>
                  <Link
                    href={`/app/roadmap/${phase.number}`}
                    className="flex items-center gap-3 rounded-md border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-background"
                  >
                    <span className="w-6 shrink-0 font-mono text-xs text-muted">{phase.number}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{phase.name}</span>
                    <span className="hidden font-mono text-xs text-muted sm:inline">{phase.progress}%</span>
                    <Badge tone={phase.status === "IN_PROGRESS" ? "info" : phase.status === "COMPLETED" ? "success" : phase.status === "BLOCKED" ? "danger" : "neutral"}>
                      {phase.status.replace(/_/g, " ")}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <OctagonAlert className="h-4 w-4 text-danger" aria-hidden />
              <CardHeading>Blocked</CardHeading>
            </div>
            {phases.flatMap((p) => p.blockers.map((b) => ({ phase: p.number, text: b }))).length === 0 ? (
              <p className="mt-2 text-[13px] text-muted">No open blockers recorded.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-[13px]">
                {phases.flatMap((p) =>
                  p.blockers.map((b) => (
                    <li key={`${p.number}-${b}`} className="rounded-md border border-danger/20 bg-danger-soft/40 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{b}</p>
                        <Badge tone="danger">Phase {p.number}</Badge>
                      </div>
                    </li>
                  )),
                )}
              </ul>
            )}
            {state.blockerNote ? (
              <p className="mt-2 text-xs text-muted">Latest note: {state.blockerNote}</p>
            ) : null}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeading>Recent update</CardHeading>
            {updates.length === 0 ? (
              <p className="mt-2 text-[13px] text-muted">
                Seed snapshot ({PROJECT_LABEL}). {canEdit ? "Use “Update project” to record the first change." : "An editor can record the first update."}
              </p>
            ) : (
              <ol className="mt-3 space-y-2 text-xs">
                {updates.map((u) => (
                  <li key={u.id} className="rounded-md border border-border bg-background px-2.5 py-2">
                    <p className="font-semibold text-navy-900">
                      Phase {u.currentPhaseNumber} · {u.projectStatus.replace(/_/g, " ")} · {u.overallProgress}%
                    </p>
                    {u.whatChanged ? <p className="mt-0.5">{u.whatChanged}</p> : null}
                    <p className="mt-0.5 text-muted">{new Date(u.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
          <Card>
            <CardHeading>How this tracker works</CardHeading>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              People update progress by hand. Percentages inform — they never complete anything on
              their own. Completion needs criteria, evidence, and an explicit review.
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

const PROJECT_LABEL = "42% manual snapshot";
