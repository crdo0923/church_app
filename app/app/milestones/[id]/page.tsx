import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { PHASES } from "@/data/tracker-seed";
import {
  getItemStatus,
  listCriteria,
  listEvidence,
  listCompletions,
  listComments,
} from "@/lib/tracker-store";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/app/Badge";
import { Card, CardHeading } from "@/components/app/Card";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeading>{title}</CardHeading>
      <div className="mt-2 text-[13px] leading-relaxed">{children}</div>
    </Card>
  );
}

export default async function MilestonePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  let found: { phase: (typeof PHASES)[number]; milestone: (typeof PHASES)[number]["milestones"][number] } | null = null;
  for (const p of PHASES) {
    const m = p.milestones.find((x) => x.id === id);
    if (m) {
      found = { phase: p, milestone: m };
      break;
    }
  }
  if (!found) notFound();
  const { phase, milestone } = found;
  const canEdit = user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "EDITOR";
  const status = await getItemStatus("milestone", milestone.id, "PLANNED");
  const criteria = await listCriteria("milestone", milestone.id);
  const evidence = await listEvidence("milestone", milestone.id);
  const completions = await listCompletions("milestone", milestone.id);
  const comments = await listComments("milestone", milestone.id);
  const tasks = phase.tasks.filter((t) => t.milestoneId === milestone.id);

  const { CriteriaList } = await import("@/components/app/CriteriaList");
  const { EvidenceForm, EvidenceList } = await import("@/components/app/EvidenceBits");
  const { CommentForm, CommentList } = await import("@/components/app/CommentBits");
  const { CompletionPanel } = await import("@/components/app/CompletionPanel");
  const { evaluateCompletionGate, summarizeCriteria } = await import("@/lib/completion");
  const summary = summarizeCriteria(
    criteria.map((c) => ({
      id: c.label,
      required: c.requirement === "REQUIRED",
      status: c.status === "COMPLETE" ? ("COMPLETE" as const) : c.status === "NOT_APPLICABLE" ? ("NOT_APPLICABLE" as const) : ("INCOMPLETE" as const),
    })),
  );
  const gate = evaluateCompletionGate({
    requiredCriteriaTotal: summary.requiredTotal,
    requiredCriteriaComplete: summary.requiredComplete,
    unresolvedBlockers: 0,
    requiredEvidencePresent: evidence.length > 0,
    evidenceRequired: false,
    documentationUpdated: true,
    documentationRequired: false,
  });

  return (
    <AppShell
      title={milestone.title}
      subtitle={`Milestone · Phase ${phase.number} ${phase.name}`}
      activePath="/app/roadmap"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin={user.role === "SUPER_ADMIN"}
    >
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[11px] text-muted">MILESTONE · PHASE {phase.number}</p>
            <h2 className="text-base font-semibold tracking-tight text-navy-900">{milestone.title}</h2>
            <p className="mt-1 max-w-2xl text-[13px] text-muted">{milestone.description}</p>
          </div>
          <Badge tone={status === "COMPLETED" ? "success" : "neutral"}>{status.replace(/_/g, " ")}</Badge>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div><dt className="text-muted">Owner</dt><dd className="font-medium">{milestone.owner || "—"}</dd></div>
          <div><dt className="text-muted">Target</dt><dd className="font-medium">{milestone.targetDate || "—"}</dd></div>
          <div><dt className="text-muted">Objective</dt><dd className="font-medium">{milestone.objective || "—"}</dd></div>
          <div><dt className="text-muted">Phase</dt><dd className="font-medium"><a className="text-accent" href={`/app/roadmap/${phase.number}`}>{phase.number} {phase.name}</a></dd></div>
        </dl>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          <Section title="Tasks in this milestone">
            {tasks.length === 0 ? (
              <p className="text-muted">No tasks linked.</p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((t) => (
                  <li key={t.id} className="rounded-md border border-border bg-background px-2.5 py-2">
                    <a href={`/app/tasks/${t.id}`} className="font-medium text-accent">{t.title}</a>
                    <p className="text-xs text-muted">{t.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="Acceptance criteria">
            <CriteriaList entityType="milestone" entityId={milestone.id} criteria={criteria} canEdit={canEdit} compact={false} />
          </Section>
          <Section title="Evidence">
            <EvidenceList evidence={evidence} />
            {canEdit ? <EvidenceForm entityType="milestone" entityId={milestone.id} /> : null}
          </Section>
          <Section title="Notes & discussion">
            <CommentList comments={comments} />
            <CommentForm entityType="milestone" entityId={milestone.id} />
          </Section>
        </div>
        <div className="space-y-4">
          <CompletionPanel entityType="milestone" entityId={milestone.id} gate={gate} canEdit={canEdit} completions={completions} title={`Mark “${milestone.title}” complete?`} />
        </div>
      </div>
    </AppShell>
  );
}
