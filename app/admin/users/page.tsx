import { requireSuperAdmin } from "@/lib/auth";
import { listUsers } from "@/lib/tracker-store";
import { AppShell } from "@/components/app/AppShell";
import { UserManager } from "@/components/app/UserManager";

export default async function AdminUsersPage() {
  const user = await requireSuperAdmin();
  const users = listUsers();
  return (
    <AppShell
      title="Users"
      subtitle="Create, invite, change roles, suspend, or reset tracker access — every action is audited"
      activePath="/admin/users"
      user={{ fullName: user.fullName, role: user.role }}
      showAdmin
    >
      <UserManager
        me={user.id}
        users={users.map((u) => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          status: u.status,
          notes: u.notes,
          createdAt: u.createdAt,
        }))}
      />
    </AppShell>
  );
}
