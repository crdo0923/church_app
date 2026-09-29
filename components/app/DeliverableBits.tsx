"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/app/Badge";

export function DeliverableBits({
  rows,
  canEdit,
}: {
  rows: { id: string; label: string; owner: string; status: string }[];
  phaseNumber: string;
  canEdit: boolean;
}) {
  const router = useRouter();

  async function toggle(id: string, next: string) {
    await fetch("/api/actions/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType: "phase", entityId: id, status: next, note: "deliverable" }),
    }).catch(() => undefined);
    // Deliverables reuse item_status keyed by deliverable id for lightweight checks.
    router.refresh();
    void next;
  }

  if (rows.length === 0) return <p className="text-muted">No deliverables listed.</p>;
  return (
    <ul className="space-y-1.5">
      {rows.map((d) => (
        <li key={d.id} className="flex items-start gap-2 rounded-md border border-border bg-background px-2.5 py-2">
          {canEdit ? (
            <input
              type="checkbox"
              checked={d.status === "COMPLETE" || d.status === "DONE"}
              onChange={() => toggle(d.id, d.status === "COMPLETE" ? "INCOMPLETE" : "COMPLETE")}
              aria-label={`Mark deliverable “${d.label}” ${d.status === "COMPLETE" ? "incomplete" : "complete"}`}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-[13px]">{d.label}</p>
            <p className="mt-0.5 flex flex-wrap gap-1">
              {d.owner ? <Badge tone="neutral">{d.owner}</Badge> : null}
              <Badge tone={d.status === "COMPLETE" || d.status === "DONE" ? "success" : "neutral"}>
                {(d.status || "INCOMPLETE").replace(/_/g, " ")}
              </Badge>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
