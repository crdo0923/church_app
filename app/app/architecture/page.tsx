import { AppShell } from "@/components/app/AppShell";
import { Card, CardHeading } from "@/components/app/Card";
import { ARCHITECTURE_LAYERS } from "@/data/reference";

export default function ArchitecturePage() {
  return (
    <AppShell
      title="Architecture Explorer"
      subtitle="Modular monolith on Next.js 16 + Supabase · reference layers (interactive graph lands in Phase H)"
      activePath="/app/architecture"
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {ARCHITECTURE_LAYERS.map((layer, i) => (
          <div key={layer.name}>
            <Card>
              <p className="font-mono text-[11px] text-muted">LAYER {String(i + 1).padStart(2, "0")}</p>
              <CardHeading>{layer.name}</CardHeading>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {layer.items.map((item) => (
                  <li key={item} className="rounded border border-border bg-background px-2 py-1 text-xs">
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
            {i < ARCHITECTURE_LAYERS.length - 1 ? (
              <p aria-hidden className="py-1 text-center font-mono text-sm text-muted">↓</p>
            ) : null}
          </div>
        ))}
      </div>
      <Card className="mt-4">
        <CardHeading>Stack target</CardHeading>
        <p className="mt-2 text-[13px] leading-relaxed text-foreground/80">
          Frontend: Next.js 16.3.6 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Lucide. Backend: App Router
          Route Handlers + Server Components + Server Actions + Zod. Data: PostgreSQL via Supabase, Drizzle ORM
          typed access, RLS authorization boundary. Auth/Storage: Supabase. Testing: Vitest + Playwright.
          CI: GitHub Actions. Hosting: Vercel (roadmapchurch.crdo.site). Observability: Sentry.
        </p>
      </Card>
    </AppShell>
  );
}
