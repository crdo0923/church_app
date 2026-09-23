import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/app/Badge";
import { Card } from "@/components/app/Card";

const TEAM = [
  { name: "Ricardo Flandez", role: "Owner · Engineering", focus: "Foundation, architecture, deploys" },
  { name: "Engineering", role: "Engineer", focus: "Assigned tasks, status updates" },
  { name: "Product", role: "Project Manager", focus: "Roadmap, milestones, risks" },
  { name: "Security", role: "Architect", focus: "RLS, checklist, ADRs" },
];

export default function TeamPage() {
  return (
    <AppShell
      title="Team"
      subtitle="Visibility, not rankings · live membership lands with Auth + RLS (Phase C/D)"
      activePath="/app/team"
    >
      <div className="grid gap-3 md:grid-cols-2">
        {TEAM.map((m) => (
          <Card key={m.name}>
            <div className="flex items-center gap-3">
              <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">
                {m.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <div>
                <p className="text-sm font-semibold text-navy-900">{m.name}</p>
                <p className="text-xs text-muted">{m.role}</p>
              </div>
              <span className="ml-auto"><Badge tone="neutral">Reference</Badge></span>
            </div>
            <p className="mt-2.5 text-xs text-foreground/80">{m.focus}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
