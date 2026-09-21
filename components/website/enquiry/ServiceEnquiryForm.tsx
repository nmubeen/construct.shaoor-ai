"use client";

import { useEffect, useState, type FormEvent } from "react";

import EnquiryQuestionField, { enquiryInputClass, enquiryLabelClass, fieldDomId } from "@/components/website/enquiry/EnquiryQuestionField";
import { websiteDesign } from "@/components/website/shared/design";
import { getEnquiryQuestionsAction, submitEnquiryAction } from "@/lib/actions/contact.actions";
import { checkAnswer, type AnswerValue, type PublicEnquiryQuestion } from "@/lib/enquiry/questions";

export type EnquiryServiceOption = { id: string; title: string };

// Value of the service dropdown's catch-all entry (no service_id is stored).
const GENERAL = "general";
const sectionTitleClass = "text-lg font-bold text-slate-900";

// THE enquiry form. Every entry point renders this same component:
//  - Home / Services list / Service detail: inside a dialog with
//    `lockedServiceId` set — the service is fixed and shown as a heading.
//  - Contact page: inline with no locked service — a "Service Interested In"
//    dropdown loads that service's questions underneath, in the same form.
// Questions always come from the tenant's configuration for the chosen
// service (getEnquiryQuestionsAction); nothing about them is hard-coded.
export default function ServiceEnquiryForm({ services, lockedServiceId, subService, onDone }: {
  services: EnquiryServiceOption[];
  lockedServiceId?: string;
  subService?: string;
  /** Called from the success panel's button; the host (e.g. a dialog) decides what "done" means. */
  onDone?: () => void;
}) {
  const [pickedId, setPickedId] = useState("");
  const serviceId = lockedServiceId ?? pickedId;
  const activeServiceId = serviceId && serviceId !== GENERAL ? serviceId : "";
  const service = services.find((item) => item.id === activeServiceId);

  const [loaded, setLoaded] = useState<{ serviceId: string; questions: PublicEnquiryQuestion[] } | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!activeServiceId) return;
    let cancelled = false;
    getEnquiryQuestionsAction(activeServiceId)
      .then((questions) => { if (!cancelled) setLoaded({ serviceId: activeServiceId, questions }); })
      // A failed load must never block the enquiry: fall back to the basic form.
      .catch(() => { if (!cancelled) setLoaded({ serviceId: activeServiceId, questions: [] }); });
    return () => { cancelled = true; };
  }, [activeServiceId]);

  const loading = !!activeServiceId && loaded?.serviceId !== activeServiceId;
  const questions = loaded?.serviceId === activeServiceId ? loaded.questions : [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || loading) return;
    const field = new FormData(event.currentTarget);
    const text = (name: string) => String(field.get(name) ?? "");

    const nextErrors: Record<string, string> = {};
    const cleaned: Record<string, AnswerValue> = {};
    for (const question of questions) {
      const checked = checkAnswer(question, answers[question.id]);
      if ("error" in checked) nextErrors[question.id] = checked.error;
      else if (checked.value !== null) cleaned[question.id] = checked.value;
    }
    setErrors(nextErrors);
    setFormError("");
    const firstInvalid = questions.find((question) => nextErrors[question.id]);
    if (firstInvalid) {
      const element = document.getElementById(fieldDomId(firstInvalid.id));
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      element?.focus({ preventScroll: true });
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitEnquiryAction({
        serviceId: activeServiceId || null,
        subService: subService || undefined,
        name: text("name"),
        phone: text("phone"),
        email: text("email"),
        projectLocation: text("projectLocation"),
        preferredContactMethod: text("preferredContactMethod") as "" | "Phone" | "WhatsApp" | "Email",
        message: text("message"),
        consent: field.get("consent") === "on",
        companyWebsite: text("companyWebsite"),
        answers: cleaned,
      });
      if (result.ok) setSubmitted(true);
      else setFormError(result.error);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div role="status" className="rounded-lg border border-[var(--site-accent)] bg-[#eef3ec] p-8 text-center">
        <h2 className="text-2xl font-bold text-[var(--site-primary)]">Thank you!</h2>
        <p className="mt-3 text-slate-700">Your enquiry has been submitted. Our team will get back to you shortly.</p>
        <button
          type="button"
          onClick={() => { setSubmitted(false); setAnswers({}); setErrors({}); onDone?.(); }}
          className={`${websiteDesign.secondaryButton} mt-6`}
        >
          {onDone ? "Close" : "Send another enquiry"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="hidden" aria-hidden="true">
        <label>Company website<input name="companyWebsite" tabIndex={-1} autoComplete="off" /></label>
      </div>

      {lockedServiceId && (
        <div className="border-l-4 border-[var(--site-accent)] pl-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Enquire About</p>
          <p className="mt-1 text-2xl font-bold text-[var(--site-primary)]">{service?.title}</p>
          {subService && <p className="mt-0.5 text-slate-600">{subService}</p>}
        </div>
      )}

      <section className="space-y-5">
        <h3 className={sectionTitleClass}>Contact Details</h3>
        <label className={enquiryLabelClass}>Name <span className="text-red-600">*</span>
          <input className={enquiryInputClass} name="name" type="text" required minLength={2} maxLength={120} placeholder="Your name" autoComplete="name" />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={enquiryLabelClass}>Mobile / WhatsApp Number <span className="text-red-600">*</span>
            <input className={enquiryInputClass} name="phone" type="tel" required maxLength={20} placeholder="+91 XXXXX XXXXX" autoComplete="tel" />
          </label>
          <label className={enquiryLabelClass}>Email <span className="text-red-600">*</span>
            <input className={enquiryInputClass} name="email" type="email" required maxLength={254} placeholder="your@email.com" autoComplete="email" />
          </label>
        </div>
        <label className={enquiryLabelClass}>Project / Site Location <span className="text-red-600">*</span>
          <input className={enquiryInputClass} name="projectLocation" type="text" required minLength={2} maxLength={200} placeholder="Area, city" autoComplete="address-level2" />
        </label>
        <label className={enquiryLabelClass}>Preferred Contact Method
          <select className={enquiryInputClass} name="preferredContactMethod" defaultValue="">
            <option value="">No preference</option>
            <option value="Phone">Phone</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Email">Email</option>
          </select>
        </label>
      </section>

      {!lockedServiceId && (
        <section>
          <label className={enquiryLabelClass}>Service Interested In <span className="text-red-600">*</span>
            <select className={enquiryInputClass} required value={pickedId} onChange={(event) => setPickedId(event.target.value)}>
              <option value="">Select a service</option>
              {services.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              <option value={GENERAL}>Other / General enquiry</option>
            </select>
          </label>
        </section>
      )}

      {loading && <p role="status" className="text-sm text-slate-500">Loading a few questions about {service?.title ?? "this service"}…</p>}

      {questions.length > 0 && (
        <section className="space-y-5">
          <h3 className={sectionTitleClass}>{lockedServiceId ? "Help us understand your project" : `Tell us about your ${service?.title ?? ""} requirement`}</h3>
          {questions.map((question) => (
            <EnquiryQuestionField
              key={question.id}
              question={question}
              value={answers[question.id]}
              error={errors[question.id]}
              onChange={(value) => {
                setAnswers((current) => ({ ...current, [question.id]: value }));
                setErrors((current) => ({ ...current, [question.id]: "" }));
              }}
            />
          ))}
        </section>
      )}

      <section className="space-y-5">
        <label className={enquiryLabelClass}>Additional Requirements{!activeServiceId && <span className="text-red-600"> *</span>}
          <textarea
            className={`${enquiryInputClass} min-h-28 resize-y`}
            name="message"
            rows={4}
            maxLength={5000}
            required={!activeServiceId}
            minLength={activeServiceId ? undefined : 10}
            placeholder={activeServiceId ? "Anything else we should know?" : "Tell us about your project..."}
          />
        </label>
        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input name="consent" type="checkbox" required className="mt-1 size-4 rounded border-slate-300 accent-[var(--site-accent)]" />
          <span>I consent to this company using my details to respond to this enquiry.</span>
        </label>
      </section>

      {formError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={submitting || loading} className={`${websiteDesign.primaryButton} w-full disabled:opacity-60 sm:w-auto`}>
          {submitting ? "Sending..." : "Submit Enquiry"}
        </button>
      </div>
    </form>
  );
}
