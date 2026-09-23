import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/app/Badge";
import { Card, CardHeading } from "@/components/app/Card";

const ROWS = [
  { provider: "GoHighLevel", category: "CRM / automation", status: "PLANNED" as const, note: "Contacts + enrollment workflow; webhook inbound later." },
  { provider: "Google Workspace", category: "Identity / docs / calendar", status: "PLANNED" as const, note: "OAuth + Drive/Calendar read later." },
  { provider: "Microsoft 365", category: "Identity / mail / calendar", status: "PLANNED" as const, note: "OAuth + Graph read later." },
  { provider: "Email Service", category: "Messaging", status: "PLANNED" as const, note: "Transactional sender; server-only key." },
  { provider: "SMS / Messaging", category: "Messaging", status: "PLANNED" as const, note: "Reminders with opt-in proof." },
  { provider: "Payment Provider", category: "Billing", status: "PLANNED" as const, note: "Enrollment fees + signed webhooks." },
  { provider: "Video Conferencing", category: "Classes", status: "PLANNED" as const, note: "Meeting links + recording metadata." },
];

export default function IntegrationsPage() {
  return (
    <AppShell
      title="Integrations"
      subtitle="Configuration + health records first — no live third-party sync in MVP"
      activePath="/app/integrations"
    >
      <Card>
        <CardHeading>Provider registry (reference)</CardHeading>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border font-mono text-[11px] uppercase tracking-wide text-muted">
                <th className="py-2 pr-3">Provider</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.provider} className="border-b border-border/60 last:border-0">
                  <td className="py-2 pr-3 font-medium">{r.provider}</td>
                  <td className="py-2 pr-3 text-muted">{r.category}</td>
                  <td className="py-2 pr-3"><Badge tone="neutral">{r.status}</Badge></td>
                  <td className="py-2 text-muted">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
