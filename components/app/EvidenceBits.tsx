"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Evidence } from "@/lib/tracker-store";
import { Badge } from "@/components/app/Badge";

async function postAction(resource: string, payload: Record<string, unknown>) {
  const res = await fetch(`/api/actions/${resource}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { ok: boolean; error?: string };
  if (!data.ok) throw new Error(data.error ?? "Request failed.");
}

export function EvidenceList({ evidence }: { evidence: Evidence[] }) {
  if (evidence.length === 0) return <p className="text-muted">No evidence attached yet.</p>;
  return (
    <ul className="space-y-1.5">
      {evidence.map((e) => (
        <li key={e.id} className="rounded-md border border-border bg-background px-2.5 py-2">
          <p className="flex flex-wrap items-center gap-2 text-[13px] font-medium">
            {e.label} <Badge tone="neutral">{e.kind}</Badge>
          </p>
          {e.url ? (
            <a href={e.url} target="_blank" rel="noreferrer" className="break-all text-xs text-accent">{e.url}</a>
          ) : null}
          {e.text ? <p className="mt-1 text-xs text-muted">{e.text}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export function EvidenceForm({ entityType, entityId }: { entityType: string; entityId: string }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setBusy(true);
    setError("");
    try {
      await postAction("evidence", { entityType, entityId, kind: url.trim() ? "URL" : "NOTE", label: label.trim(), url: url.trim(), text: text.trim() });
      setLabel("");
      setUrl("");
      setText("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not attach evidence.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 space-y-2" aria-label="Attach evidence">
      <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={300} placeholder="Evidence label — e.g. Auth review notes" aria-label="Evidence label" className="w-full rounded-md border border-border bg-white px-2.5 py-2 text-[13px]" />
      <input value={url} onChange={(e) => setUrl(e.target.value)} maxLength={2000} placeholder="URL (optional)" aria-label="Evidence URL" className="w-full rounded-md border border-border bg-white px-2.5 py-2 text-[13px]" />
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} rows={2} placeholder="Note (optional)" aria-label="Evidence note" className="w-full rounded-md border border-border bg-white px-2.5 py-2 text-[13px]" />
      {error ? <p role="alert" className="text-xs text-danger">{error}</p> : null}
      <button type="submit" disabled={busy || !label.trim()} className="rounded-md bg-navy-900 px-3 py-2 text-[13px] font-medium text-white disabled:opacity-60">
        {busy ? "Attaching…" : "Attach evidence"}
      </button>
    </form>
  );
}
