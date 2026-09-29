"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TaskCreateForm({
  phaseNumber,
  milestones,
  preselectedMilestone,
}: {
  phaseNumber: string;
  milestones: { id: string; title: string }[];
  preselectedMilestone: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    summary: "",
    description: "",
    owner: "",
    priority: "MEDIUM",
    targetDate: "",
    milestoneId: preselectedMilestone,
    dependencies: "",
    technicalNotes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/actions/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phaseNumber, ...form }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; id?: string };
      if (!data.ok) throw new Error(data.error ?? "Could not create task.");
      router.push(`/app/tasks/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create task.");
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-1 w-full rounded-md border border-border bg-white px-2.5 py-2 text-[13px]";
  return (
    <form onSubmit={submit} className="mt-3 space-y-3" aria-label="Create task">
      <label className="block text-xs font-medium">Title<input required maxLength={300} value={form.title} onChange={(e) => set("title", e.target.value)} className={input} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium">Milestone
          <select value={form.milestoneId} onChange={(e) => set("milestoneId", e.target.value)} className={input}>
            {milestones.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </label>
        <label className="block text-xs font-medium">Priority
          <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className={input}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </label>
        <label className="block text-xs font-medium">Owner<input maxLength={200} value={form.owner} onChange={(e) => set("owner", e.target.value)} className={input} /></label>
        <label className="block text-xs font-medium">Target date<input maxLength={30} value={form.targetDate} onChange={(e) => set("targetDate", e.target.value)} placeholder="e.g. Oct 2026" className={input} /></label>
      </div>
      <label className="block text-xs font-medium">Summary<textarea rows={2} maxLength={2000} value={form.summary} onChange={(e) => set("summary", e.target.value)} className={input} /></label>
      <label className="block text-xs font-medium">Description / requirements<textarea rows={3} maxLength={10000} value={form.description} onChange={(e) => set("description", e.target.value)} className={input} /></label>
      <label className="block text-xs font-medium">Dependencies<textarea rows={2} maxLength={4000} value={form.dependencies} onChange={(e) => set("dependencies", e.target.value)} placeholder="What must finish first?" className={input} /></label>
      <label className="block text-xs font-medium">Technical notes<textarea rows={2} maxLength={10000} value={form.technicalNotes} onChange={(e) => set("technicalNotes", e.target.value)} className={input} /></label>
      {error ? <p role="alert" className="text-xs text-danger">{error}</p> : null}
      <button type="submit" disabled={busy || !form.title.trim()} className="inline-flex min-h-[44px] items-center rounded-md bg-navy-900 px-4 text-[13px] font-medium text-white disabled:opacity-60">
        {busy ? "Creating…" : "Create task"}
      </button>
    </form>
  );
}
