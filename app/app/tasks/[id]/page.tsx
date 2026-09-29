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

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  let found: { phase: (typeof PHASES)[number]; task: (typeof PHASES)[number]["tasks"][number] } | null = null;
  for (const p of PHASES) {
    const t = p.tasks.find((x) => x.id === id);
    if (t) {
      found = { phase: p, task: t };
      break;
    }
  }
  if (!found) notFound();
  const { phase, task } = found;
  const milestone = phase.milestones.find((m) => m.id === task.milestoneId);
  const canEdit = user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "EDITOR";
  const status = await getItemStatus("task", task.id, "BACKLOG");
  const criteria = await listCriteria("task", task.id);
  const evidence = await listEvidence("task", task.id);
  const completions = await listCompletions("task", task.id);
  const comments = await listComments("task", task.id);

  const { CriteriaList } = await import("@/components/app/CriteriaList");
  const { EvidenceForm, EvidenceList } = await import("@/components/app/EvidenceBits");
  const { CommentForm, CommentList } = await import("@/components/app/CommentBits");
  const { CompletionPanel } = await import("@/components/app/CompletionPanel");
  const { StatusChanger } = await import("@/components/app/StatusChanger");
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
    unresolvedBlockers: status === "BLOCKED" ? 1 : 0,
    requiredEvidencePresent: evidence.length > 0,
    evidenceRequired: false,
    documentationUpdated: true,
    documentationRequired: false,
  });

  return (
    <AppShell
      title={task.title}
      subtitle={`Task · Phase ${phase.number} ${phase.name}${milestone ? ` · ${milestone.title}` : ""}`}
      activePath="/app/roadmap"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin={user.role === "SUPER_ADMIN"}
    >
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[11px] text-muted">TASK · PHASE {phase.number}</p>
            <h2 className="text-base font-semibold tracking-tight text-navy-900">{task.title}</h2>
            <p className="mt-1 max-w-2xl text-[13px] text-muted">{task.summary}</p>
          </div>
          <Badge tone={status === "DONE" || status === "COMPLETED" ? "success" : status === "BLOCKED" ? "danger" : "neutral"}>
            {status.replace(/_/g, " ")}
          </Badge>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div><dt className="text-muted">Owner</dt><dd className="font-medium">{task.owner || "—"}</dd></div>
          <div><dt className="text-muted">Milestone</dt><dd className="font-medium">{milestone ? milestone.title : "—"}</dd></div>
          <div><dt className="text-muted">Phase</dt><dd className="font-medium"><a className="text-accent" href={`/app/roadmap/${phase.number}`}>{phase.number} {phase.name}</a></dd></div>
          <div><dt className="text-muted">Description</dt><dd className="font-medium">{task.description || "—"}</dd></div>
        </dl>
        {canEdit ? (
          <div className="mt-3 border-t border-border pt-3">
            <StatusChanger entityType="task" entityId={task.id} current={status} kind="task" />
          </div>
        ) : null}
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          <Section title="Requirements">
            <p>{task.description || task.summary}</p>
          </Section>
          <Section title="Acceptance criteria">
            <CriteriaList entityType="task" entityId={task.id} criteria={criteria} canEdit={canEdit} compact={false} />
          </Section>
          <Section title="Evidence">
            <EvidenceList evidence={evidence} />
            {canEdit ? <EvidenceForm entityType="task" entityId={task.id} /> : null}
          </Section>
          <Section title="Technical notes">
            <p className="text-muted">Use notes below for implementation details. Technical notes field ships with custom task creation.</p>
          </Section>
          <Section title="Notes & discussion">
            <CommentList comments={comments} />
            <CommentForm entityType="task" entityId={task.id} />
          </Section>
        </div>
        <div className="space-y-4">
          <CompletionPanel entityType="task" entityId={task.id} gate={gate} canEdit={canEdit} completions={completions} title={`Mark “${task.title}” complete?`} />
        </div>
      </div>
    </AppShell>
  );
}
