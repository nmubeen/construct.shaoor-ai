import { notFound } from "next/navigation";

import AdminPage from "@/components/admin/layout/AdminPage";
import ServiceForm from "@/components/admin/services/ServiceForm";
import { getService } from "@/lib/actions/service.actions";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditServicePage({
  params,
}: PageProps) {
  const { id } = await params;
  const numericId = Number(id);

  if (Number.isNaN(numericId) || numericId < 1) {
    notFound();
  }

  const service = await getService(numericId);

  if (!service) {
    notFound();
  }

  return (
    <AdminPage
      title="Edit Service"
      description="Update service details."
    >

      <ServiceForm
        mode="edit"
        service={service}
      />
    </AdminPage>
  );
}