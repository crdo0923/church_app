import { Card, CardHeading } from "@/components/app/Card";
import { LoginForm, SetupForm, InviteAcceptForm } from "@/components/app/AuthForms";
import { bootstrapNeeded } from "@/lib/tracker-store";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const user = await currentUser();
  if (user) redirect("/app/overview");
  const { invite } = await searchParams;
  // Invite links take precedence: a signed-out invitee must always see the
  // accept form, even when no Super Admin exists yet or a session lingers.
  const needsSetup = !invite && bootstrapNeeded();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-sm">
        <p className="text-sm font-semibold text-navy-900">Church Leadership LMS</p>
        <p className="text-xs text-muted">Project Roadmap · Sign in to manage the project roadmap.</p>
        <p className="mt-2 rounded-md border border-border bg-background px-2.5 py-2 text-[11px] leading-relaxed text-muted">
          Tracker accounts are independent from the Church Leadership LMS. This sign-in is for the
          roadmap tracker only — never use LMS student, faculty, or production credentials here.
        </p>
        {invite ? (
          <>
            <CardHeading>Accept invitation</CardHeading>
            <InviteAcceptForm token={invite} />
          </>
        ) : needsSetup ? (
          <>
            <div className="mt-3 rounded-md border border-warning/30 bg-warning-soft/50 px-2.5 py-2 text-[11px] text-warning">
              Initial administrator setup required. Create the Super Admin account with the
              bootstrap password from the server environment.
            </div>
            <SetupForm />
          </>
        ) : (
          <LoginForm />
        )}
      </Card>
    </div>
  );
}
