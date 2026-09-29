import { redirect } from "next/navigation";
import { requireEditor } from "@/lib/auth";
import { getPhase } from "@/lib/tracker-store";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardHeading } from "@/components/app/Card";
import { TaskCreateForm } from "@/components/app/TaskCreateForm";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string; milestone?: string }>;
}) {
  const user = await requireEditor();
  const { phase, milestone } = await searchParams;
  const phaseSeed = getPhase(phase ?? "01");
  if (!phaseSeed) redirect("/app/roadmap");
  const milestones = phaseSeed.milestones;
  return (
    <AppShell
      title="Add task"
      subtitle={`Phase ${phaseSeed.number} ${phaseSeed.name} — tasks need completion criteria before they can be marked done`}
      activePath="/app/roadmap"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin={user.role === "SUPER_ADMIN"}
    >
      <Card>
        <CardHeading>Task details</CardHeading>
        <TaskCreateForm phaseNumber={phaseSeed.number} milestones={milestones} preselectedMilestone={milestone ?? milestones[0]?.id ?? ""} />
      </Card>
    </AppShell>
  );
}
