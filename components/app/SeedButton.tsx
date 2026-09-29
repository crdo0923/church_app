"use client";

import { useState } from "react";

export function SeedButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function run() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/actions/seed", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; reason?: string; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Seed failed.");
      setMessage(data.reason ?? "Seed complete.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Seed failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="inline-flex min-h-[44px] items-center rounded-md border border-border px-3 text-[13px] font-medium disabled:opacity-60"
      >
        {busy ? "Seeding…" : "Run seed check"}
      </button>
      {message ? <p role="status" className="mt-2 text-xs text-muted">{message}</p> : null}
    </div>
  );
}
