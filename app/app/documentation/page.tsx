import { AppShell } from "@/components/app/AppShell";
import { Card } from "@/components/app/Card";

const DOCS = [
  { title: "architecture.md", desc: "System topology, layers, folder + route + component map" },
  { title: "database.md", desc: "Schema contract, indexes, RLS model, seed" },
  { title: "authentication.md", desc: "Supabase Auth flows, callbacks, MFA seam" },
  { title: "authorization.md", desc: "8-role RBAC matrix + server/RLS enforcement" },
  { title: "deployment.md", desc: "Vercel + roadmapchurch.crdo.site wiring" },
  { title: "environments.md", desc: "Local → production promotion rules" },
  { title: "integrations.md", desc: "7 providers as config records first" },
  { title: "security.md", desc: "Boundaries + 12-control checklist" },
  { title: "testing.md", desc: "Vitest + Playwright + RLS test plan" },
  { title: "roadmap.md", desc: "10 seeded phases + dependency chain" },
];

export default function DocumentationPage() {
  return (
    <AppShell title="Documentation" subtitle="Shipped docs — searchable Markdown module lands in Phase K" activePath="/app/documentation">
      <div className="grid gap-3 md:grid-cols-2">
        {DOCS.map((d) => (
          <Card key={d.title} className="py-3">
            <p className="font-mono text-sm font-semibold text-navy-900">{d.title}</p>
            <p className="mt-1 text-xs text-muted">{d.desc}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
