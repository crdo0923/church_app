import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/app/Badge";
import { Card, CardHeading } from "@/components/app/Card";

const STACK = [
  { category: "Frontend", name: "Next.js 16.3.6", purpose: "App framework (RSC, routing, SSR)", status: "Selected" },
  { category: "Frontend", name: "Tailwind CSS v4", purpose: "Design tokens + utility styling", status: "Selected" },
  { category: "Frontend", name: "shadcn/ui", purpose: "Owned accessible primitives", status: "Selected" },
  { category: "Frontend", name: "Lucide React", purpose: "Icon system", status: "Selected" },
  { category: "Backend", name: "Route Handlers + Server Actions", purpose: "API + mutations, Zod-validated", status: "Selected" },
  { category: "Backend", name: "Zod", purpose: "Input validation on every mutation", status: "Selected" },
  { category: "Database", name: "PostgreSQL (Supabase)", purpose: "System of record, RLS boundary", status: "Selected" },
  { category: "Database", name: "Drizzle ORM", purpose: "Typed schema, migrations, queries", status: "Selected" },
  { category: "Auth", name: "Supabase Auth", purpose: "Email+password, magic link, OAuth stubs", status: "Selected" },
  { category: "Storage", name: "Supabase Storage", purpose: "Private buckets, no local-FS uploads", status: "Selected" },
  { category: "Testing", name: "Vitest + Playwright", purpose: "Unit + E2E + a11y smoke", status: "Selected" },
  { category: "CI/CD", name: "GitHub Actions → Vercel", purpose: "Lint/typecheck/test/build/e2e gates", status: "Selected" },
  { category: "Hosting", name: "Vercel", purpose: "Web runtime at roadmapchurch.crdo.site", status: "Selected" },
  { category: "Monitoring", name: "Sentry + Vercel Observability", purpose: "Errors + logs + traces", status: "Planned" },
];

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <AppShell title={title} subtitle="Reference content — live module lands post-MVP foundation" activePath="/app/overview">
      <Card>
        <CardHeading>{title}</CardHeading>
        <p className="mt-2 text-[13px] leading-relaxed text-foreground/80">{body}</p>
        <p className="mt-2 text-[11px] text-muted">No fake controls on this page: interactive management ships with its persistence phase.</p>
      </Card>
    </AppShell>
  );
}

export default function FrontendPage() {
  return (
    <AppShell
      title="Technology Stack"
      subtitle="Every dependency must have a reason · reference (live explorer lands in Phase H)"
      activePath="/app/frontend"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {STACK.map((t) => (
          <Card key={t.name} className="py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-navy-900">{t.name}</p>
              <Badge tone={t.status === "Selected" ? "success" : "warning"}>{t.status}</Badge>
            </div>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-muted">{t.category}</p>
            <p className="mt-1.5 text-xs text-foreground/80">{t.purpose}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

export { Placeholder };
