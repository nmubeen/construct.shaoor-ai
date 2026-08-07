import AdminPage from "@/components/admin/layout/AdminPage";
import ClientForm from "@/components/admin/clients/ClientForm";

export default function NewClientPage() {
  return (
    <AdminPage
      title="New Client"
      description="Add a new client."
    >
      <ClientForm mode="create" />
    </AdminPage>
  );
}
