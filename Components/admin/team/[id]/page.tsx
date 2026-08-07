import { notFound } from "next/navigation";
import PageHeader from "@/components/admin/common/PageHeader";
import TeamForm from "@/components/admin/team/TeamForm";
import { getTeamMember } from "@/lib/actions/team.actions";

export default async function Edit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getTeamMember(Number(id));

  if (!member) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title="Edit Team Member"
        description="Update team member details."
      />
      <TeamForm mode="edit" member={member} />
    </>
  );
}
