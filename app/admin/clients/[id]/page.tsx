import { notFound } from "next/navigation";

import AdminPage from "@/components/admin/layout/AdminPage";
import ClientForm from "@/components/admin/clients/ClientForm";
import { getClient } from "@/lib/actions/client.actions";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditClientPage({
  params,
}: PageProps) {
  const { id } = await params;
  const numericId = Number(id);

  if (Number.isNaN(numericId) || numericId < 1) {
    notFound();
  }

  const client = await getClient(numericId);

  if (!client) {
    notFound();
  }

  return (
    <AdminPage
      title="Edit Client"
      description="Update client details."
    >
      <ClientForm mode="edit" client={client} />
    </AdminPage>
  );
}
