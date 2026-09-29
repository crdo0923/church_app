/**
 * Tracker progress + completion rules — pure functions, fully unit-tested.
 *
 * Mental model (§5–§11, §19, §38):
 * - Progress percentages INFORM; they never auto-complete anything.
 * - A phase/milestone/task can only be marked complete via an explicit,
 *   human-confirmed completion review (optionally with override).
 * - Calculated progress is based on completed REQUIRED items only.
 * - A manual progress override is allowed but must always show its source.
 */

export type CompletionState = "READY" | "NOT_READY";

export interface CriterionLike {
  id: string;
  required: boolean;
  status: "COMPLETE" | "INCOMPLETE" | "NOT_APPLICABLE";
}

export interface CompletionCheckInput {
  requiredCriteriaTotal: number;
  requiredCriteriaComplete: number;
  unresolvedBlockers: number;
  requiredEvidencePresent: boolean;
  evidenceRequired: boolean;
  documentationUpdated: boolean;
  documentationRequired: boolean;
  overrideReason?: string | null;
}

/** Normalize a criterion list: NOT_APPLICABLE items never count as required. */
export function summarizeCriteria(
  criteria: CriterionLike[],
): { requiredTotal: number; requiredComplete: number; missing: string[] } {
  const required = criteria.filter((c) => c.required);
  const applicable = required.filter((c) => c.status !== "NOT_APPLICABLE");
  return {
    requiredTotal: applicable.length,
    requiredComplete: applicable.filter((c) => c.status === "COMPLETE").length,
    missing: applicable.filter((c) => c.status !== "COMPLETE").map((c) => c.id),
  };
}

/**
 * Completion gate (§9): returns READY only when every required input is met.
 * An override does NOT make the item READY — it only records an audited
 * exception path that the UI must render distinctly (§10).
 */
export function evaluateCompletionGate(input: CompletionCheckInput): {
  state: CompletionState;
  missing: string[];
  hasOverride: boolean;
} {
  const missing: string[] = [];
  if (input.requiredCriteriaTotal > input.requiredCriteriaComplete)
    missing.push(
      `acceptance-criteria:${input.requiredCriteriaComplete}/${input.requiredCriteriaTotal}`,
    );
  if (input.unresolvedBlockers > 0)
    missing.push(`blockers:${input.unresolvedBlockers}`);
  if (input.evidenceRequired && !input.requiredEvidencePresent)
    missing.push("evidence:missing");
  if (input.documentationRequired && !input.documentationUpdated)
    missing.push("documentation:not-updated");

  const hasOverride = (input.overrideReason ?? "").trim().length > 0;
  return {
    state: missing.length === 0 ? "READY" : "NOT_READY",
    missing,
    hasOverride,
  };
}

/** A phase may be marked COMPLETED only after an explicit review approves it. */
export function canMarkPhaseComplete(args: {
  gateState: CompletionState;
  reviewApproved: boolean;
}): boolean {
  return args.gateState === "READY" && args.reviewApproved;
}

export type ProgressSource = "calculated" | "manual";

export interface ProgressDisplay {
  percent: number;
  source: ProgressSource;
  /** e.g. "Based on task completion" or "Manual update" — never hide this. */
  basis: string;
}

/**
 * Displayed progress (§19): manual override wins but must say so.
 * Calculated progress counts completed REQUIRED items over applicable required items.
 */
export function displayProgress(args: {
  calculatedPercent: number;
  manualPercent: number | null;
}): ProgressDisplay {
  if (args.manualPercent !== null && Number.isFinite(args.manualPercent)) {
    const percent = Math.min(100, Math.max(0, Math.round(args.manualPercent)));
    return { percent, source: "manual", basis: "Manual update" };
  }
  const percent = Math.min(
    100,
    Math.max(0, Math.round(args.calculatedPercent)),
  );
  return {
    percent,
    source: "calculated",
    basis: "Based on required items completion",
  };
}

/** Calculated phase progress: completed required tasks / applicable required tasks. */
export function calculatedTaskProgress(
  tasks: { required: boolean; status: string; notApplicable?: boolean }[],
): number {
  const applicable = tasks.filter((t) => t.required && !t.notApplicable);
  if (applicable.length === 0) return 0;
  const done = applicable.filter(
    (t) => t.status === "DONE" || t.status === "COMPLETED",
  ).length;
  return Math.round((done / applicable.length) * 100);
}

export type ProjectPlanningStatus =
  | "PLANNING"
  | "ON_TRACK"
  | "AT_RISK"
  | "BLOCKED"
  | "ON_HOLD"
  | "COMPLETED";

/** Planning statuses are human-set only — this validates the vocabulary (§18). */
export function isValidProjectStatus(s: string): s is ProjectPlanningStatus {
  return (
    s === "PLANNING" ||
    s === "ON_TRACK" ||
    s === "AT_RISK" ||
    s === "BLOCKED" ||
    s === "ON_HOLD" ||
    s === "COMPLETED"
  );
}
