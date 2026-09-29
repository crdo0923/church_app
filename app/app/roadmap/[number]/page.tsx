import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import {
  getItemStatus,
  getPhase,
  listCriteria,
  listEvidence,
  listCompletions,
  listComments,
  taskDoneCount,
} from "@/lib/tracker-store";
import { evaluateCompletionGate, summarizeCriteria, displayProgress } from "@/lib/completion";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/app/Badge";
import { Card, CardHeading } from "@/components/app/Card";
import { CompletionPanel } from "@/components/app/CompletionPanel";
import { CriteriaList } from "@/components/app/CriteriaList";
import { EvidenceForm, EvidenceList } from "@/components/app/EvidenceBits";
import { CommentForm, CommentList } from "@/components/app/CommentBits";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeading>{title}</CardHeading>
      <div className="mt-2 text-[13px] leading-relaxed">{children}</div>
    </Card>
  );
}

export default async function PhaseDetailPage({ params }: { params: Promise<{ number: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { number } = await params;
  const phase = getPhase(number);
  if (!phase) notFound();
  const phaseId = `phase-${phase.number}`;
  const canEdit = user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "EDITOR";

  const status = getItemStatus("phase", phaseId, phase.number === "01" ? "IN_PROGRESS" : "PLANNED");
  const criteria = listCriteria("phase", phaseId);
  const evidence = listEvidence("phase", phaseId);
  const completions = listCompletions("phase", phaseId);
  const comments = listComments("phase", phaseId);
  const { done, total } = taskDoneCount(phase.number);
  const db = (await import("@/lib/tracker-db")).getDb();
  let manual: number | null = null;
  if (db) {
    const row = db.prepare("SELECT percent FROM manual_progress WHERE entity_type='phase' AND entity_id=?").get(phaseId) as { percent: number } | undefined;
    if (row) manual = Number(row.percent);
  }
  if (manual === null && phase.number === "01") manual = 42;
  const calc = total === 0 ? 0 : Math.round((done / total) * 100);
  const progress = displayProgress({ calculatedPercent: calc, manualPercent: manual });
  const summary = summarizeCriteria(
    criteria.map((c) => ({ id: c.label, required: c.requirement === "REQUIRED", status: c.status === "COMPLETE" ? "COMPLETE" : c.status === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : "INCOMPLETE" })),
  );
  const gate = evaluateCompletionGate({
    requiredCriteriaTotal: summary.requiredTotal,
    requiredCriteriaComplete: summary.requiredComplete,
    unresolvedBlockers: phase.blockers.length,
    requiredEvidencePresent: evidence.length > 0,
    evidenceRequired: true,
    documentationUpdated: true,
    documentationRequired: false,
  });

  return (
    <AppShell
      title={`${phase.number} · ${phase.name}`}
      subtitle="Phase brief — objective, scope, deliverables, milestones, tasks, criteria, evidence"
      activePath="/app/roadmap"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin={user.role === "SUPER_ADMIN"}
    >
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[11px] text-muted">PHASE {phase.number}</p>
            <h2 className="text-base font-semibold tracking-tight text-navy-900">{phase.name}</h2>
            <p className="mt-1 max-w-2xl text-[13px] text-muted">{phase.summary}</p>
          </div>
          <Badge tone={status === "IN_PROGRESS" ? "info" : status === "COMPLETED" ? "success" : status === "BLOCKED" ? "danger" : "neutral"}>
            {status.replace(/_/g, " ")}
          </Badge>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Phase progress">
          <div className="h-full rounded-full bg-accent" style={{ width: `${progress.percent}%` }} />
        </div>
        <p className="mt-1 font-mono text-[11px] text-muted">{progress.percent}% · {progress.basis} · tasks {done}/{total}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div><dt className="text-muted">Owner</dt><dd className="font-medium">{phase.owner}</dd></div>
          <div><dt className="text-muted">Target</dt><dd className="font-medium">{phase.target}</dd></div>
          <div><dt className="text-muted">Dependencies</dt><dd className="font-medium">{phase.dependencies}</dd></div>
          <div><dt className="text-muted">Last review</dt><dd className="font-medium">{completions[0] ? new Date(completions[0].createdAt).toLocaleString() : "Not completed yet"}</dd></div>
        </dl>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          <Section title="Objective"><p>{phase.objective}</p></Section>
          <Section title="Scope">
            <ul className="list-disc pl-5">{phase.scope.map((s) => <li key={s}>{s}</li>)}</ul>
          </Section>
          <Section title="Out of scope">
            <ul className="list-disc pl-5">{phase.outOfScope.map((s) => <li key={s}>{s}</li>)}</ul>
          </Section>
          <Section title="Deliverables">
            <DeliverableList phaseNumber={phase.number} canEdit={canEdit} />
          </Section>
          <Section title="Milestones">
            <ul className="space-y-2">
              {phase.milestones.map((m) => (
                <li key={m.id} className="rounded-md border border-border bg-background px-2.5 py-2">
                  <a href={`/app/milestones/${m.id}`} className="font-medium text-accent">{m.title}</a>
                  <p className="text-xs text-muted">{m.description} · Owner: {m.owner} · Target: {m.targetDate}</p>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Tasks">
            <ul className="space-y-2">
              {phase.tasks.map((t) => (
                <li key={t.id} className="rounded-md border border-border bg-background px-2.5 py-2">
                  <a href={`/app/tasks/${t.id}`} className="font-medium text-accent">{t.title}</a>
                  <p className="text-xs text-muted">{t.summary} · Owner: {t.owner || "—"}</p>
                </li>
              ))}
            </ul>
            {canEdit ? (
              <a href={`/app/tasks/new?phase=${phase.number}`} className="mt-2 inline-flex min-h-[44px] items-center rounded-md border border-border px-3 text-[13px] font-medium">
                Add task
              </a>
            ) : null}
          </Section>
          <Section title="Acceptance criteria">
            <CriteriaList entityType="phase" entityId={phaseId} criteria={criteria} canEdit={canEdit} compact={false} />
          </Section>
          <Section title="Risks & blockers">
            {phase.risks.length === 0 && phase.blockers.length === 0 ? (
              <p className="text-muted">None recorded.</p>
            ) : (
              <ul className="list-disc pl-5">
                {phase.risks.map((r) => <li key={r}>Risk: {r}</li>)}
                {phase.blockers.map((b) => <li key={b}>Blocker: {b}</li>)}
              </ul>
            )}
          </Section>
          <Section title="Evidence">
            <EvidenceList evidence={evidence} />
            {canEdit ? <EvidenceForm entityType="phase" entityId={phaseId} /> : null}
          </Section>
          <Section title="Notes & discussion">
            <CommentList comments={comments} />
            <CommentForm entityType="phase" entityId={phaseId} />
          </Section>
        </div>
        <div className="space-y-4">
          <CompletionPanel
            entityType="phase"
            entityId={phaseId}
            gate={gate}
            canEdit={canEdit}
            completions={completions}
            title={`Mark phase ${phase.number} complete?`}
          />
        </div>
      </div>
    </AppShell>
  );
}

import { getDb } from "@/lib/tracker-db";
import { DeliverableBits } from "@/components/app/DeliverableBits";

async function DeliverableList({ phaseNumber, canEdit }: { phaseNumber: string; canEdit: boolean }) {
  const db = getDb();
  const rows = db
    ? ((db.prepare("SELECT * FROM deliverables WHERE phase_number=? ORDER BY position").all(phaseNumber) as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        label: String(r.label),
        owner: String(r.owner ?? ""),
        status: String(r.status),
      })))
    : [];
  return <DeliverableBits rows={rows} phaseNumber={phaseNumber} canEdit={canEdit} />;
}
