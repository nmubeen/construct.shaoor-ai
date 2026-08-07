import { getServices } from "@/lib/actions/service.actions";

import AdminPage from "@/components/admin/layout/AdminPage";
import EmptyState from "@/components/admin/common/EmptyState";
import ServiceTable from "@/components/admin/services/ServiceTable";

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <AdminPage
      title="Services"
      description="Manage the services displayed on your website."
      action={{
        label: "New Service",
        href: "/admin/services/new",
      }}
    >
      {services.length === 0 ? (
        <EmptyState
          title="No Services Yet"
          description="Add your first service to get started."
          actionLabel="New Service"
          actionHref="/admin/services/new"
        />
      ) : (
        <ServiceTable services={services} />
      )}

    </AdminPage>
  );
}
