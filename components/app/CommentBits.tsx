"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CommentList({ comments }: { comments: { id: string; body: string; authorId: string | null; createdAt: string }[] }) {
  if (comments.length === 0) return <p className="text-muted">No notes yet.</p>;
  return (
    <ul className="space-y-1.5">
      {comments.map((c) => (
        <li key={c.id} className="rounded-md border border-border bg-background px-2.5 py-2">
          <p className="text-[13px]">{c.body}</p>
          <p className="mt-1 text-[11px] text-muted">{new Date(c.createdAt).toLocaleString()}</p>
        </li>
      ))}
    </ul>
  );
}

export function CommentForm({ entityType, entityId }: { entityType: string; entityId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/actions/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, body: body.trim() }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Could not add note.");
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add note.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 flex gap-2" aria-label="Add note">
      <input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={4000}
        placeholder="Add a note…"
        aria-label="Note text"
        className="min-w-0 flex-1 rounded-md border border-border bg-white px-2.5 py-2 text-[13px]"
      />
      <button type="submit" disabled={busy || !body.trim()} className="shrink-0 rounded-md bg-navy-900 px-3 py-2 text-[13px] font-medium text-white disabled:opacity-60">
        {busy ? "Adding…" : "Add"}
      </button>
      {error ? <p role="alert" className="sr-only">{error}</p> : null}
    </form>
  );
}
