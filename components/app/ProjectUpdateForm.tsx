"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["PLANNING", "ON_TRACK", "AT_RISK", "BLOCKED", "ON_HOLD", "COMPLETED"] as const;
const PHASES = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"] as const;

export function ProjectUpdateForm({
  initial,
}: {
  initial: {
    projectStatus: string;
    currentPhaseNumber: string;
    overallProgress: number;
    currentFocus: string;
    blockerNote: string;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    projectStatus: initial.projectStatus,
    currentPhaseNumber: initial.currentPhaseNumber,
    overallProgress: initial.overallProgress,
    currentFocus: initial.currentFocus,
    whatChanged: "",
    whatsNext: "",
    blockerNote: initial.blockerNote,
    updateNote: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/actions/project-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, progressSource: "MANUAL" }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Could not save update.");
      router.push("/app/overview");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save update.");
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-1 w-full rounded-md border border-border bg-white px-2.5 py-2 text-[13px]";
  return (
    <form onSubmit={submit} className="mt-4 space-y-3" aria-label="Update project">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-xs font-medium">
          Current phase
          <select value={form.currentPhaseNumber} onChange={(e) => set("currentPhaseNumber", e.target.value)} className={input}>
            {PHASES.map((p) => (
              <option key={p} value={p}>Phase {p}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium">
          Project status
          <select value={form.projectStatus} onChange={(e) => set("projectStatus", e.target.value)} className={input}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium">
          Overall progress (0–100, manual)
          <input type="number" min={0} max={100} value={form.overallProgress} onChange={(e) => set("overallProgress", Number(e.target.value))} className={input} />
        </label>
      </div>
      <label className="block text-xs font-medium">
        Current focus
        <input maxLength={500} value={form.currentFocus} onChange={(e) => set("currentFocus", e.target.value)} placeholder="What exactly is being done?" className={input} />
      </label>
      <label className="block text-xs font-medium">
        What changed
        <textarea rows={3} maxLength={4000} value={form.whatChanged} onChange={(e) => set("whatChanged", e.target.value)} className={input} />
      </label>
      <label className="block text-xs font-medium">
        What&apos;s next
        <textarea rows={3} maxLength={4000} value={form.whatsNext} onChange={(e) => set("whatsNext", e.target.value)} className={input} />
      </label>
      <label className="block text-xs font-medium">
        Blockers
        <textarea rows={2} maxLength={2000} value={form.blockerNote} onChange={(e) => set("blockerNote", e.target.value)} className={input} />
      </label>
      <label className="block text-xs font-medium">
        Update note
        <textarea rows={2} maxLength={4000} value={form.updateNote} onChange={(e) => set("updateNote", e.target.value)} placeholder="Who should know what?" className={input} />
      </label>
      {error ? (
        <p role="alert" className="rounded-md border border-danger/20 bg-danger-soft/50 px-2.5 py-2 text-xs text-danger">{error}</p>
      ) : null}
      <button type="submit" disabled={busy} className="inline-flex min-h-[44px] items-center rounded-md bg-navy-900 px-4 text-[13px] font-medium text-white disabled:opacity-60">
        {busy ? "Saving…" : "Save update"}
      </button>
    </form>
  );
}
