import AdminPage from "@/components/admin/layout/AdminPage";
import EmptyState from "@/components/admin/common/EmptyState";

import ClientTable from "@/components/admin/clients/ClientTable";

import { getClients } from "@/lib/actions/client.actions";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <AdminPage
      title="Clients"
      description="Manage client logos and profile information."
      action={{
        label: "New Client",
        href: "/admin/clients/new",
      }}
    >
      {clients.length === 0 ? (
        <EmptyState
          title="No Clients Yet"
          description="Add your first client."
          actionLabel="New Client"
          actionHref="/admin/clients/new"
        />
      ) : (
        <ClientTable clients={clients} />
      )}
    </AdminPage>
  );
}
