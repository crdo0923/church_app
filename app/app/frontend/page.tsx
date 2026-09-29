import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardHeading } from "@/components/app/Card";

export default async function TechnologyPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const rows = [
    { name: "Next.js 16 + React 19 + TypeScript", note: "Tracker application framework." },
    { name: "Tailwind CSS v4", note: "Design tokens and styling." },
    { name: "Embedded SQLite (node:sqlite)", note: "Team-only tracker accounts and roadmap data. No new database service." },
    { name: "Zod", note: "Input validation on every mutation." },
    { name: "Vitest + Playwright", note: "Unit and end-to-end testing." },
  ];
  return (
    <AppShell
      title="Technology"
      subtitle="What this tracker is built with — every dependency has a reason"
      activePath="/app/frontend"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin={user.role === "SUPER_ADMIN"}
    >
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((r) => (
          <Card key={r.name} className="py-3">
            <CardHeading>{r.name}</CardHeading>
            <p className="mt-1 text-xs text-muted">{r.note}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
