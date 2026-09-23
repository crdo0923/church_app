import { AppShell } from "@/components/app/AppShell";
import { Card, CardHeading } from "@/components/app/Card";

export default function TestingPage() {
  return (
    <AppShell title="Testing" subtitle="Reference — live QA tracking ships with Phase M" activePath="/app/testing">
      <Card>
        <CardHeading>Strategy (reference)</CardHeading>
        <p className="mt-2 text-[13px] text-foreground/80">
          Vitest unit (progress, permissions, validators) → Drizzle + RLS integration on ephemeral branches →
          Playwright E2E (login → task lifecycle → viewer denial → mobile) → axe a11y + npm audit/semgrep. Gates run every phase.
        </p>
      </Card>
    </AppShell>
  );
}
