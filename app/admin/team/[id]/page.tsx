import { notFound } from "next/navigation";

import AdminPage from "@/components/admin/layout/AdminPage";
import TeamForm from "@/components/admin/team/TeamForm";
import { getTeamMember } from "@/lib/actions/team.actions";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTeamMemberPage({
  params,
}: PageProps) {
  const { id } = await params;
  const member = await getTeamMember(Number(id));

  if (!member) {
    notFound();
  }

  return (
    <AdminPage
        title="Edit Team Member"
        description="Update team member details."
    >

      <TeamForm mode="edit" member={member} />
    </AdminPage>
  );
}
