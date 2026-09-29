"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Criterion } from "@/lib/tracker-store";
import { Badge } from "@/components/app/Badge";

async function postAction(resource: string, payload: Record<string, unknown>) {
  const res = await fetch(`/api/actions/${resource}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { ok: boolean; error?: string };
  if (!data.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

export function CriteriaList({
  entityType,
  entityId,
  criteria,
  canEdit,
  compact,
}: {
  entityType: "phase" | "milestone" | "task";
  entityId: string;
  criteria: Criterion[];
  canEdit: boolean;
  compact: boolean;
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle(id: string, next: "COMPLETE" | "INCOMPLETE") {
    setError("");
    try {
      await postAction("criterion", { criterionId: id, status: next, entityType, entityId });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update criterion.");
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setBusy(true);
    setError("");
    try {
      await postAction("criterion", { entityType, entityId, label: label.trim() });
      setLabel("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add criterion.");
    } finally {
      setBusy(false);
    }
  }

  if (criteria.length === 0 && !canEdit) {
    return <p className="text-muted">No acceptance criteria yet.</p>;
  }

  return (
    <div>
      <ul className="space-y-1.5">
        {criteria.map((c) => (
          <li key={c.id} className="flex items-start gap-2 rounded-md border border-border bg-background px-2.5 py-2">
            {canEdit ? (
              <input
                type="checkbox"
                checked={c.status === "COMPLETE"}
                onChange={() => toggle(c.id, c.status === "COMPLETE" ? "INCOMPLETE" : "COMPLETE")}
                aria-label={`Mark “${c.label}” ${c.status === "COMPLETE" ? "incomplete" : "complete"}`}
                className="mt-0.5 h-4 w-4 shrink-0"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-[13px]">{c.label}</p>
              <p className="mt-0.5 flex flex-wrap gap-1">
                <Badge tone="neutral">{c.category.replace(/_/g, " ")}</Badge>
                <Badge tone={c.requirement === "REQUIRED" ? "info" : "neutral"}>{c.requirement.replace(/_/g, " ")}</Badge>
                <Badge tone={c.status === "COMPLETE" ? "success" : "neutral"}>{c.status.replace(/_/g, " ")}</Badge>
              </p>
            </div>
          </li>
        ))}
      </ul>
      {!compact && criteria.length === 0 ? (
        <p className="mt-2 text-xs text-muted">No criteria yet — add what “must be true” before this can be marked complete.</p>
      ) : null}
      {canEdit && !compact ? (
        <form onSubmit={add} className="mt-2 flex gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={500}
            placeholder="Add acceptance criterion…"
            aria-label="New acceptance criterion"
            className="min-w-0 flex-1 rounded-md border border-border bg-white px-2.5 py-2 text-[13px]"
          />
          <button type="submit" disabled={busy || !label.trim()} className="shrink-0 rounded-md bg-navy-900 px-3 py-2 text-[13px] font-medium text-white disabled:opacity-60">
            {busy ? "Adding…" : "Add"}
          </button>
        </form>
      ) : null}
      {error ? <p role="alert" className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
