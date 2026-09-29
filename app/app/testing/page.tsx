import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardHeading } from "@/components/app/Card";

export default async function TestingPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <AppShell
      title="Testing"
      subtitle="What is verified before calling tracker work complete"
      activePath="/app/testing"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin={user.role === "SUPER_ADMIN"}
    >
      <Card>
        <CardHeading>Gates</CardHeading>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px]">
          <li>lint · typecheck · unit tests · production build on every change.</li>
          <li>End-to-end: setup → invite → editor update → viewer read-only → completion gate → audit.</li>
          <li>Completion criteria and overrides are covered by unit tests.</li>
        </ul>
      </Card>
    </AppShell>
  );
}
