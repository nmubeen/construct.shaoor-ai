"use client";

import { useTransition } from "react";

import { submitMessage } from "@/lib/actions/contact.actions";
import { notify } from "@/lib/toast";
import TextField from "@/components/admin/fields/TextField";
import TextAreaField from "@/components/admin/fields/TextAreaField";
import SelectField from "@/components/admin/fields/SelectField";
import AdminSection from "@/components/admin/layout/AdminSection";
import Button from "@/components/admin/primitives/Button";

export default function ContactForm() {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(
    formData: FormData
  ) {
    startTransition(async () => {
      try {
        await submitMessage(formData);

        notify.success(
          "Thank you! Your enquiry has been submitted."
        );

        const form =
          document.getElementById(
            "contact-form"
          ) as HTMLFormElement;

        form.reset();
      } catch (error) {
        notify.error(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
      }
    });
  }

  return (
    <form
      id="contact-form"
      action={handleSubmit}
      className="space-y-8 rounded-xl bg-white p-6 shadow sm:p-8"
    >
      <div className="hidden" aria-hidden="true">
        <label>Company website<input name="companyWebsite" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <AdminSection
        title="Enquiry Details"
        description="Share your requirements and our team will get back to you."
      >
        <div className="py-6">
          <TextField
            label="Name"
            name="name"
            type="text"
            required
            placeholder="Your Name"
            autoComplete="name"
          />

          <TextField
            label="Email"
            name="email"
            type="email"
            required
            placeholder="your@email.com"
            autoComplete="email"
          />

          <TextField
            label="Phone"
            name="phone"
            type="text"
            placeholder="+91 XXXXX XXXXX"
            autoComplete="tel"
          />

          <TextField
            label="Subject"
            name="subject"
            type="text"
            placeholder="Project enquiry"
          />

          <SelectField
            label="Service Required"
            name="projectInterest"
            defaultValue="Architecture"
            options={[
              { label: "Architecture", value: "Architecture" },
              { label: "Construction", value: "Construction" },
              { label: "Interior Design", value: "Interior Design" },
              { label: "Renovation", value: "Renovation" },
              { label: "Other", value: "Other" },
            ]}
          />

          <TextAreaField
            label="Message"
            name="message"
            required
            rows={6}
            placeholder="Tell us about your project..."
          />
        </div>
      </AdminSection>

      <label className="flex items-start gap-3 text-sm text-slate-600">
        <input name="consent" type="checkbox" required className="mt-1 size-4 rounded border-slate-300 text-teal-600" />
        <span>I consent to this company using my details to respond to this enquiry.</span>
      </label>

      <div className="mt-8 flex justify-end gap-4 border-t border-slate-200 pt-6">
        <Button type="submit" loading={isPending}>
          {isPending ? "Sending..." : "Send Enquiry"}
        </Button>
      </div>
    </form>
  );
}
