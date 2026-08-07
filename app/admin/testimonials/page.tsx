import AdminPage from "@/components/admin/layout/AdminPage";
import EmptyState from "@/components/admin/common/EmptyState";

import TestimonialTable from "@/components/admin/testimonials/TestimonialTable";

import { getTestimonials } from "@/lib/actions/testimonial.actions";

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();

  return (
    <AdminPage
      title="Testimonials"
      description="Manage client testimonials displayed on your website."
      action={{
        label: "New Testimonial",
        href: "/admin/testimonials/new",
      }}
    >
      {testimonials.length === 0 ? (
        <EmptyState
          title="No Testimonials Yet"
          description="Add your first testimonial."
          actionLabel="New Testimonial"
          actionHref="/admin/testimonials/new"
        />
      ) : (
        <TestimonialTable testimonials={testimonials} />
      )}
    </AdminPage>
  );
}
