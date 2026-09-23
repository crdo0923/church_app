import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/app/Badge";
import { Card, CardHeading } from "@/components/app/Card";

const CHECKS = [
  "MFA enforced (Owner/Admin)",
  "RLS enabled + tested on all tables",
  "Secure cookies / SameSite / PKCE",
  "Zod validation on all mutations",
  "Rate limiting (auth, webhooks, search)",
  "Server-side API authorization",
  "Append-only audit logging",
  "Secret management (no committed secrets)",
  "Backup verification (Supabase PITR)",
  "Restore drill on staging",
  "Dependency scanning (Dependabot + npm audit)",
  "Security headers (next.config + verify)",
];

export default function SecurityPage() {
  return (
    <AppShell
      title="Security Center"
      subtitle="Checklist states NOT STARTED → IN PROGRESS → IMPLEMENTED → VERIFIED (live tracking lands in Phase L)"
      activePath="/app/security"
    >
      <Card>
        <CardHeading>Controls (reference baseline)</CardHeading>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {CHECKS.map((c) => (
            <li key={c} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-[13px]">
              <span>{c}</span>
              <Badge tone="neutral">Not started</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </AppShell>
  );
}
