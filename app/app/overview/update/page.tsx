import { requireEditor } from "@/lib/auth";
import { getProjectState } from "@/lib/tracker-store";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardHeading } from "@/components/app/Card";
import { ProjectUpdateForm } from "@/components/app/ProjectUpdateForm";

export default async function ProjectUpdatePage() {
  const user = await requireEditor();
  const state = await getProjectState();
  return (
    <AppShell
      title="Update project"
      subtitle="Manual update — you are the source of truth"
      activePath="/app/overview"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin={user.role === "SUPER_ADMIN"}
    >
      <Card>
        <CardHeading>What changed since the last update?</CardHeading>
        <ProjectUpdateForm
          initial={{
            projectStatus: state.projectStatus,
            currentPhaseNumber: state.currentPhaseNumber,
            overallProgress: state.overallProgress,
            currentFocus: state.currentFocus,
            blockerNote: state.blockerNote,
          }}
        />
      </Card>
    </AppShell>
  );
}
