import AdminPage from "@/components/admin/layout/AdminPage";
import TestimonialForm from "@/components/admin/testimonials/TestimonialForm";

export default function NewTestimonialPage() {
  return (
    <AdminPage
      title="New Testimonial"
      description="Add a new testimonial."
    >
      <TestimonialForm mode="create" />
    </AdminPage>
  );
}
