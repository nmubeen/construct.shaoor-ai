"use client";

import type { FAQ } from "@prisma/client";
import { useRouter } from "next/navigation";

import {
  createFAQ,
  updateFAQ,
} from "@/lib/actions/faq.actions";

import FormActions from "@/components/admin/common/FormActions";
import AdminSection from "@/components/admin/layout/AdminSection";
import NumberField from "@/components/admin/fields/NumberField";
import SwitchField from "@/components/admin/fields/SwitchField";
import TextField from "@/components/admin/fields/TextField";
import TextAreaField from "@/components/admin/fields/TextAreaField";
import { notify } from "@/lib/toast";
import { Entity, Messages } from "@/lib/messages";

interface FAQFormProps {
  mode: "create" | "edit";
  faq?: FAQ;
}

export default function FAQForm({
  mode,
  faq,
}: FAQFormProps) {
  const router = useRouter();
  const action =
    mode === "create"
      ? createFAQ
      : updateFAQ.bind(null, faq!.id);

  async function handleSubmit(formData: FormData) {
    try {
      await action(formData);
      notify.success(mode === "create" ? Messages.created(Entity.faq) : Messages.updated(Entity.faq));
      router.push("/admin/faq");
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
        title="FAQ Content"
        description="Question and answer content displayed on the website."
      >
        <div className="space-y-6">
          <TextField
            label="Question"
            name="question"
            placeholder="What services do you provide?"
            required
            defaultValue={faq?.question ?? ""}
          />

          <TextAreaField
            label="Answer"
            name="answer"
            rows={5}
            required
            defaultValue={faq?.answer ?? ""}
          />

          <TextField
            label="Category"
            name="category"
            placeholder="General"
            defaultValue={faq?.category ?? ""}
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
            defaultValue={faq?.displayOrder ?? 0}
          />

          <div className="space-y-4">
            <SwitchField
              name="featured"
              label="Featured"
              text="Show as Featured"
              defaultChecked={faq?.featured ?? false}
            />

            <SwitchField
              name="active"
              label="Status"
              text="Active"
              defaultChecked={faq?.active ?? true}
            />
          </div>
        </div>
      </AdminSection>

      <FormActions
        cancelHref="/admin/faq"
        submitLabel={
          mode === "create" ? "Create FAQ" : "Update FAQ"
        }
      />
    </form>
  );
}
