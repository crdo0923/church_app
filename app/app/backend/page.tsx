import { AppShell } from "@/components/app/AppShell";
import { Card, CardHeading } from "@/components/app/Card";

export default function BackendPage() {
  return (
    <AppShell title="Backend" subtitle="Reference — live module ships with server/ + Drizzle phases" activePath="/app/backend">
      <Card>
        <CardHeading>Server architecture (reference)</CardHeading>
        <p className="mt-2 font-mono text-xs leading-loose text-muted">
          app/ routes → Server Actions / Route Handlers (authZ + Zod) → server/services → Drizzle queries → Supabase PG (RLS)
        </p>
        <p className="mt-2 text-[13px] text-foreground/80">
          No DB calls in components. Every mutation validates input, checks workspace membership + role, and writes an audit row.
        </p>
      </Card>
    </AppShell>
  );
}
