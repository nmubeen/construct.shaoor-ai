import AdminPage from "@/components/admin/layout/AdminPage";
import EmptyState from "@/components/admin/common/EmptyState";

import FAQTable from "@/components/admin/faq/FAQTable";

import { getFAQs } from "@/lib/actions/faq.actions";

export default async function FAQPage() {
  const faqs = await getFAQs();

  return (
    <AdminPage
      title="FAQ"
      description="Manage frequently asked questions shown on your website."
      action={{
        label: "New FAQ",
        href: "/admin/faq/new",
      }}
    >
      {faqs.length === 0 ? (
        <EmptyState
          title="No FAQs Yet"
          description="Add your first FAQ item."
          actionLabel="New FAQ"
          actionHref="/admin/faq/new"
        />
      ) : (
        <FAQTable faqs={faqs} />
      )}
    </AdminPage>
  );
}
