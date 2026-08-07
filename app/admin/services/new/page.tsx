import AdminPage from "@/components/admin/layout/AdminPage";
import ServiceForm from "@/components/admin/services/ServiceForm";

export default function NewServicePage() {
  return (
    <AdminPage
      title="New Service"
      description="Add a new service."
    >

      <ServiceForm mode="create" />
    </AdminPage>
  );
}