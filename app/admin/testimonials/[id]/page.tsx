import { notFound } from "next/navigation";

import AdminPage from "@/components/admin/layout/AdminPage";
import TestimonialForm from "@/components/admin/testimonials/TestimonialForm";
import { getTestimonial } from "@/lib/actions/testimonial.actions";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTestimonialPage({
  params,
}: PageProps) {
  const { id } = await params;
  const numericId = Number(id);

  if (Number.isNaN(numericId) || numericId < 1) {
    notFound();
  }

  const testimonial = await getTestimonial(numericId);

  if (!testimonial) {
    notFound();
  }

  return (
    <AdminPage
      title="Edit Testimonial"
      description="Update testimonial details."
    >
      <TestimonialForm
        mode="edit"
        testimonial={testimonial}
      />
    </AdminPage>
  );
}
