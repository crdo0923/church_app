import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardHeading } from "@/components/app/Card";

export default async function SecurityPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <AppShell
      title="Security"
      subtitle="How this tracker protects accounts and roadmap data"
      activePath="/app/security"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin={user.role === "SUPER_ADMIN"}
    >
      <Card>
        <CardHeading>Tracker security rules</CardHeading>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px]">
          <li>Passwords are hashed with scrypt — never stored or shown in plaintext.</li>
          <li>The bootstrap password lives only in server environment configuration.</li>
          <li>Sessions are random tokens in httpOnly cookies; sign-out destroys them.</li>
          <li>Viewers are read-only — edit routes re-check roles on the server.</li>
          <li>Every account, role, and completion decision is written to the audit log.</li>
          <li>Phase 09 tracks the planned LMS security requirements separately.</li>
        </ul>
      </Card>
    </AppShell>
  );
}
