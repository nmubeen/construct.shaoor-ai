import AdminPage from "@/components/admin/layout/AdminPage";
import EmptyState from "@/components/admin/common/EmptyState";

import TeamTable from "@/components/admin/team/TeamTable";

import { getTeamMembers } from "@/lib/actions/team.actions";

export default async function TeamPage() {
  const members = await getTeamMembers();

  return (
    <AdminPage
      title="Team"
      description="Manage your key team members."
      action={{
        label: "New Team Member",
        href: "/admin/team/new",
      }}
    >
      {members.length === 0 ? (
        <EmptyState
          title="No Team Members Yet"
          description="Add your first team member."
          actionLabel="New Team Member"
          actionHref="/admin/team/new"
        />
      ) : (
        <TeamTable members={members} />
      )}
    </AdminPage>
  );
}
