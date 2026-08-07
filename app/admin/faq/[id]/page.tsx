import { notFound } from "next/navigation";

import AdminPage from "@/components/admin/layout/AdminPage";
import FAQForm from "@/components/admin/faq/FAQForm";
import { getFAQ } from "@/lib/actions/faq.actions";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditFAQPage({
  params,
}: PageProps) {
  const { id } = await params;
  const numericId = Number(id);

  if (Number.isNaN(numericId) || numericId < 1) {
    notFound();
  }

  const faq = await getFAQ(numericId);

  if (!faq) {
    notFound();
  }

  return (
    <AdminPage
      title="Edit FAQ"
      description="Update FAQ details."
    >
      <FAQForm mode="edit" faq={faq} />
    </AdminPage>
  );
}
