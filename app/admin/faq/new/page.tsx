import AdminPage from "@/components/admin/layout/AdminPage";
import FAQForm from "@/components/admin/faq/FAQForm";

export default function NewFAQPage() {
  return (
    <AdminPage
      title="New FAQ"
      description="Add a new FAQ item."
    >
      <FAQForm mode="create" />
    </AdminPage>
  );
}
