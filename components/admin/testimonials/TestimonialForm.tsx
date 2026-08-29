"use client";

import type { Testimonial } from "@prisma/client";
import { useRouter } from "next/navigation";

import {
  createTestimonial,
  updateTestimonial,
} from "@/lib/actions/testimonial.actions";

import FormActions from "@/components/admin/common/FormActions";
import ImageUpload from "@/components/admin/common/ImageUpload";
import AdminSection from "@/components/admin/layout/AdminSection";
import NumberField from "@/components/admin/fields/NumberField";
import SwitchField from "@/components/admin/fields/SwitchField";
import TextField from "@/components/admin/fields/TextField";
import TextAreaField from "@/components/admin/fields/TextAreaField";
import { notify } from "@/lib/toast";
import { Entity, Messages } from "@/lib/messages";

interface TestimonialFormProps {
  mode: "create" | "edit";
  testimonial?: Testimonial;
}

export default function TestimonialForm({
  mode,
  testimonial,
}: TestimonialFormProps) {
  const router = useRouter();
  const action =
    mode === "create"
      ? createTestimonial
      : updateTestimonial.bind(null, testimonial!.id);

  async function handleSubmit(formData: FormData) {
    try {
      await action(formData);
      notify.success(mode === "create" ? Messages.created(Entity.testimonial) : Messages.updated(Entity.testimonial));
      router.push("/admin/testimonials");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : Messages.unexpected);
    }
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-8 rounded-xl bg-white p-6 shadow sm:p-8"
    >
      <AdminSection
        title="Client Information"
        description="Details about the client giving this testimonial."
      >
        <div className="space-y-6">
          <ImageUpload
            label="Photo"
            name="photo"
            defaultValue={testimonial?.photo ?? ""}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              label="Client Name"
              name="clientName"
              placeholder="John Smith"
              required
              defaultValue={testimonial?.clientName ?? ""}
            />

            <TextField
              label="Company"
              name="company"
              placeholder="Acme Builders"
              defaultValue={testimonial?.company ?? ""}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              label="Designation"
              name="designation"
              placeholder="Project Director"
              defaultValue={testimonial?.designation ?? ""}
            />

            <TextField
              label="Project Name"
              name="projectName"
              placeholder="Skyline Tower"
              defaultValue={testimonial?.projectName ?? ""}
            />
          </div>
        </div>
      </AdminSection>

      <AdminSection
        title="Testimonial"
        description="Client feedback that will be shown on the website."
      >
        <div className="space-y-6">
          <NumberField
            label="Rating"
            name="rating"
            min="1"
            max="5"
            helperText="Use a value between 1 and 5."
            defaultValue={testimonial?.rating ?? 5}
          />

          <TextAreaField
            label="Testimonial"
            name="testimonial"
            rows={5}
            required
            defaultValue={testimonial?.testimonial ?? ""}
          />
        </div>
      </AdminSection>

      <AdminSection
        title="Display Settings"
        description="Control visibility and ordering."
      >
        <div className="space-y-6">
          <NumberField
            label="Display Order"
            name="displayOrder"
            min="0"
            helperText="Lower numbers appear first."
            defaultValue={testimonial?.displayOrder ?? 0}
          />

          <div className="space-y-4">
            <SwitchField
              name="featured"
              label="Featured"
              text="Show as Featured"
              defaultChecked={testimonial?.featured ?? false}
            />

            <SwitchField
              name="active"
              label="Status"
              text="Active"
              defaultChecked={testimonial?.active ?? true}
            />
          </div>
        </div>
      </AdminSection>

      <FormActions
        cancelHref="/admin/testimonials"
        submitLabel={
          mode === "create"
            ? "Create Testimonial"
            : "Update Testimonial"
        }
      />
    </form>
  );
}
