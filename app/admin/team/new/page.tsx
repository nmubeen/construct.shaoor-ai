import AdminPage from "@/components/admin/layout/AdminPage";
import TeamForm from "@/components/admin/team/TeamForm";

export default function NewTeamMemberPage() {
  return (
    <AdminPage
        title="New Team Member"
        description="Add a new team member."
    >

      <TeamForm mode="create" />
    </AdminPage>
  );
}
