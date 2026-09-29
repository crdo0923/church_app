"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CompletionRecord } from "@/lib/tracker-store";
import { Badge } from "@/components/app/Badge";
import { Card, CardHeading } from "@/components/app/Card";

export function CompletionPanel({
  entityType,
  entityId,
  gate,
  canEdit,
  completions,
  title,
}: {
  entityType: "phase" | "milestone" | "task";
  entityId: string;
  gate: { state: "READY" | "NOT_READY"; missing: string[]; hasOverride: boolean };
  canEdit: boolean;
  completions: CompletionRecord[];
  title: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function act(action: "complete" | "reopen") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/actions/completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          approved: action === "complete",
          reopen: action === "reopen",
          completionNotes: notes,
          overrideReason: overrideReason.trim(),
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Request failed.");
      setOpen(false);
      setNotes("");
      setOverrideReason("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeading>Completion status</CardHeading>
      <p className="mt-2">
        <Badge tone={gate.state === "READY" ? "success" : "warning"}>
          {gate.state === "READY" ? "Ready to complete" : "Not ready"}
        </Badge>
      </p>
      {gate.missing.length > 0 ? (
        <ul className="mt-2 list-disc pl-5 text-xs text-muted">
          {gate.missing.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-muted">All required inputs are met. A person must still confirm.</p>
      )}
      {completions.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs">
          {completions.slice(0, 3).map((c) => (
            <li key={c.id} className="rounded border border-border bg-background px-2 py-1.5">
              <span className="font-medium">{c.action.replace(/_/g, " ")}</span>
              {c.overrideReason ? <span className="text-warning"> · override: {c.overrideReason}</span> : null}
              {c.notes ? <span className="text-muted"> · {c.notes}</span> : null}
              <span className="block text-muted">{new Date(c.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {canEdit ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex min-h-[44px] items-center rounded-md bg-navy-900 px-3 text-[13px] font-medium text-white"
          >
            {open ? "Close review" : "Review completion"}
          </button>
          {completions.some((c) => c.action !== "REOPENED") ? (
            <button
              type="button"
              onClick={() => act("reopen")}
              disabled={busy}
              className="inline-flex min-h-[44px] items-center rounded-md border border-border px-3 text-[13px] font-medium disabled:opacity-60"
            >
              Reopen
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">Only editors can run the completion review.</p>
      )}
      {open && canEdit ? (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <p className="text-[13px] font-medium">{title}</p>
          <label className="block text-xs font-medium">
            Completion notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={4000} className="mt-1 w-full rounded-md border border-border bg-white px-2.5 py-2 text-[13px]" />
          </label>
          <label className="block text-xs font-medium">
            Override reason (only if completing while items above are missing)
            <textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} rows={2} maxLength={4000} placeholder="Recorded in Activity — never silent" className="mt-1 w-full rounded-md border border-border bg-white px-2.5 py-2 text-[13px]" />
          </label>
          {error ? <p role="alert" className="text-xs text-danger">{error}</p> : null}
          <button type="button" onClick={() => act("complete")} disabled={busy} className="inline-flex min-h-[44px] items-center rounded-md bg-success px-3 text-[13px] font-medium text-white disabled:opacity-60">
            {busy ? "Saving…" : "Mark complete"}
          </button>
        </div>
      ) : null}
    </Card>
  );
}
