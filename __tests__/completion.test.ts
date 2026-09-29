import { describe, expect, it } from "vitest";
import {
  canMarkPhaseComplete,
  calculatedTaskProgress,
  displayProgress,
  evaluateCompletionGate,
  summarizeCriteria,
} from "@/lib/completion";
import { canAccessAdmin, canEdit, canManageUsers } from "@/lib/validation";

describe("summarizeCriteria", () => {
  it("ignores NOT_APPLICABLE required items", () => {
    const s = summarizeCriteria([
      { id: "a", required: true, status: "COMPLETE" },
      { id: "b", required: true, status: "NOT_APPLICABLE" },
      { id: "c", required: false, status: "INCOMPLETE" },
    ]);
    expect(s.requiredTotal).toBe(1);
    expect(s.requiredComplete).toBe(1);
    expect(s.missing).toEqual([]);
  });

  it("lists missing required items", () => {
    const s = summarizeCriteria([
      { id: "a", required: true, status: "INCOMPLETE" },
      { id: "b", required: true, status: "COMPLETE" },
    ]);
    expect(s.missing).toEqual(["a"]);
  });
});

describe("evaluateCompletionGate", () => {
  it("is READY when everything is met", () => {
    const g = evaluateCompletionGate({
      requiredCriteriaTotal: 3,
      requiredCriteriaComplete: 3,
      unresolvedBlockers: 0,
      requiredEvidencePresent: true,
      evidenceRequired: true,
      documentationUpdated: true,
      documentationRequired: true,
    });
    expect(g.state).toBe("READY");
  });

  it("blocks on criteria, blockers, evidence", () => {
    const g = evaluateCompletionGate({
      requiredCriteriaTotal: 3,
      requiredCriteriaComplete: 1,
      unresolvedBlockers: 2,
      requiredEvidencePresent: false,
      evidenceRequired: true,
      documentationUpdated: false,
      documentationRequired: true,
    });
    expect(g.state).toBe("NOT_READY");
    expect(g.missing).toContain("acceptance-criteria:1/3");
    expect(g.missing).toContain("blockers:2");
    expect(g.missing).toContain("evidence:missing");
    expect(g.missing).toContain("documentation:not-updated");
  });

  it("never auto-completes: review approval is separate", () => {
    expect(canMarkPhaseComplete({ gateState: "READY", reviewApproved: false })).toBe(false);
    expect(canMarkPhaseComplete({ gateState: "READY", reviewApproved: true })).toBe(true);
    expect(canMarkPhaseComplete({ gateState: "NOT_READY", reviewApproved: true })).toBe(false);
  });
});

describe("displayProgress", () => {
  it("prefers manual but labels the source", () => {
    expect(displayProgress({ calculatedPercent: 10, manualPercent: 42 })).toEqual({
      percent: 42,
      source: "manual",
      basis: "Manual update",
    });
    expect(displayProgress({ calculatedPercent: 25, manualPercent: null })).toEqual({
      percent: 25,
      source: "calculated",
      basis: "Based on required items completion",
    });
  });
});

describe("calculatedTaskProgress", () => {
  it("counts required applicable DONE tasks only", () => {
    expect(
      calculatedTaskProgress([
        { required: true, status: "DONE" },
        { required: true, status: "IN_PROGRESS" },
        { required: true, status: "DONE", notApplicable: true },
        { required: false, status: "DONE" },
      ]),
    ).toBe(50);
  });
});

describe("roles", () => {
  it("viewer is read-only; editors edit; admins manage users; only super admin enters admin", () => {
    expect(canEdit("VIEWER")).toBe(false);
    expect(canEdit("EDITOR")).toBe(true);
    expect(canManageUsers("EDITOR")).toBe(false);
    expect(canManageUsers("ADMIN")).toBe(true);
    expect(canAccessAdmin("ADMIN")).toBe(false);
    expect(canAccessAdmin("SUPER_ADMIN")).toBe(true);
  });
});
