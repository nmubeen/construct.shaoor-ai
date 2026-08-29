import PageHeader from "@/components/admin/common/PageHeader";
import TeamForm from "@/components/admin/team/TeamForm";

export default function NewTeamMemberPage() {
  return (
    <>
      <PageHeader
        title="New Team Member"
        description="Add a new team member."
      />
      <TeamForm mode="create" />
    </>
  );
}
