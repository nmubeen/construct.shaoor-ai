"use client";

import { useTransition } from "react";

import { submitMessage } from "@/lib/actions/contact.actions";
import { notify } from "@/lib/toast";
import { websiteDesign } from "@/components/website/shared/design";

const inputClass = "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[var(--site-accent)] focus:ring-4 focus:ring-[var(--site-accent)]/25";
const labelClass = "block text-sm font-semibold text-slate-700";

export default function ContactForm({ services }: { services: string[] }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await submitMessage(formData);

        notify.success("Thank you! Your enquiry has been submitted.");

        const form = document.getElementById("contact-form") as HTMLFormElement;
        form.reset();
      } catch (error) {
        notify.error(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  }

  return (
    // Same visual language as ContactInfo (rounded-lg bg-slate-50 p-8
    // shadow-sm), not the generic dashboard admin field components this
    // used before — those brought their own red required-asterisk styling
    // and spacing, which is why the two panels used to look unrelated.
    <form
      id="contact-form"
      action={handleSubmit}
      className="rounded-lg bg-slate-50 p-8 shadow-sm"
    >
      <div className="hidden" aria-hidden="true">
        <label>Company website<input name="companyWebsite" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <h2 className="mb-2 text-3xl font-bold">Enquiry Details</h2>
      <p className="mb-6 text-slate-600">Share your requirements and our team will get back to you.</p>

      <div className="space-y-5">
        <label className={labelClass}>
          Name
          <input className={inputClass} name="name" type="text" required placeholder="Your Name" autoComplete="name" />
        </label>

        <label className={labelClass}>
          Email
          <input className={inputClass} name="email" type="email" required placeholder="your@email.com" autoComplete="email" />
        </label>

        <label className={labelClass}>
          Phone
          <input className={inputClass} name="phone" type="text" placeholder="+91 XXXXX XXXXX" autoComplete="tel" />
        </label>

        <label className={labelClass}>
          Subject
          <input className={inputClass} name="subject" type="text" placeholder="Project enquiry" />
        </label>

        <label className={labelClass}>
          Service Required
          <select className={inputClass} name="projectInterest" defaultValue={services[0] ?? "Other"}>
            {services.map((service) => <option key={service} value={service}>{service}</option>)}
            <option value="Other">Other</option>
          </select>
        </label>

        <label className={labelClass}>
          Message
          <textarea className={`${inputClass} min-h-36 resize-y`} name="message" required rows={6} placeholder="Tell us about your project..." />
        </label>
      </div>

      <label className="mt-6 flex items-start gap-3 text-sm text-slate-600">
        <input name="consent" type="checkbox" required className="mt-1 size-4 rounded border-slate-300 text-[var(--site-accent)]" />
        <span>I consent to this company using my details to respond to this enquiry.</span>
      </label>

      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={isPending} className={`${websiteDesign.primaryButton} disabled:opacity-60`}>
          {isPending ? "Sending..." : "Send Enquiry"}
        </button>
      </div>
    </form>
  );
}
