"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TASK_STATUSES = ["BACKLOG", "READY", "IN_PROGRESS", "IN_REVIEW", "BLOCKED"] as const;
const ITEM_STATUSES = ["PLANNED", "READY", "IN_PROGRESS", "IN_REVIEW", "BLOCKED"] as const;

export function StatusChanger({
  entityType,
  entityId,
  current,
  kind,
}: {
  entityType: "phase" | "milestone" | "task";
  entityId: string;
  current: string;
  kind: "task" | "item";
}) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const options = kind === "task" ? TASK_STATUSES : ITEM_STATUSES;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/actions/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, status, note }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Could not update status.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2" aria-label="Update status">
      <label className="block text-xs font-medium">
        Status
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 rounded-md border border-border bg-white px-2.5 py-2 text-[13px]">
          <option value={current}>{current.replace(/_/g, " ")} (current)</option>
          {options.filter((o) => o !== current).map((o) => (
            <option key={o} value={o}>{o.replace(/_/g, " ")}</option>
          ))}
        </select>
      </label>
      <label className="block min-w-0 flex-1 text-xs font-medium">
        Note (recorded in Activity)
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={4000} placeholder="Why is this changing?" className="mt-1 w-full rounded-md border border-border bg-white px-2.5 py-2 text-[13px]" />
      </label>
      <button type="submit" disabled={busy || status === current} className="inline-flex min-h-[44px] items-center rounded-md bg-navy-900 px-3 text-[13px] font-medium text-white disabled:opacity-60">
        {busy ? "Saving…" : "Update status"}
      </button>
      {error ? <p role="alert" className="w-full text-xs text-danger">{error}</p> : null}
      <p className="w-full text-[11px] text-muted">DONE/COMPLETED is only possible through the completion review on the right.</p>
    </form>
  );
}
