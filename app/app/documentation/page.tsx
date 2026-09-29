import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardHeading } from "@/components/app/Card";

const DOCS = [
  { title: "Product model", body: "This tracker is a human-maintained project roadmap. It is not the LMS, it stores no LMS operational data, and nothing external changes progress automatically." },
  { title: "Completion rules", body: "Nothing completes on status change alone. Required criteria, evidence, and an explicit review decide completion. Overrides require a recorded reason." },
  { title: "Roles", body: "Super Admin manages tracker accounts. Admin manages roadmap and users when permitted. Editors update roadmap content. Viewers read." },
  { title: "Tracker accounts vs LMS accounts", body: "Tracker accounts are independent from the Church Leadership LMS. Never reuse LMS student, faculty, or production credentials here." },
  { title: "architecture.md", body: "System topology, layers, folder, route, and component map." },
  { title: "database.md", body: "Embedded SQLite model, seed strategy, and audit approach." },
  { title: "deployment.md", body: "Vercel project roadmapchurch and roadmapchurch.crdo.site wiring." },
  { title: "security.md", body: "Secrets, hashing, session, and server-side enforcement rules." },
  { title: "testing.md", body: "Vitest, Playwright, and the critical end-to-end scenario." },
];

export default async function DocumentationPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <AppShell
      title="Documentation"
      subtitle="How this tracker works — plain language first"
      activePath="/app/documentation"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin={user.role === "SUPER_ADMIN"}
    >
      <div className="grid gap-3 md:grid-cols-2">
        {DOCS.map((d) => (
          <Card key={d.title} className="py-3">
            <CardHeading>{d.title}</CardHeading>
            <p className="mt-1 text-xs leading-relaxed text-muted">{d.body}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
