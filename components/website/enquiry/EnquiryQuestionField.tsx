"use client";

import type { AnswerValue, PublicEnquiryQuestion } from "@/lib/enquiry/questions";

export const enquiryInputClass = "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[var(--site-accent)] focus:ring-4 focus:ring-[var(--site-accent)]/25";
export const enquiryLabelClass = "block text-sm font-semibold text-slate-700";

const choiceClass = "flex cursor-pointer items-center gap-2.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 has-[:checked]:border-[var(--site-accent)] has-[:checked]:bg-[#eef3ec] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[var(--site-accent)]/25";
const controlClass = "size-4 accent-[var(--site-accent)]";
// Past this many options a radio list gets long on a phone, so use a dropdown.
const MAX_RADIO_OPTIONS = 6;

export function fieldDomId(questionId: string) {
  return `enquiry-q-${questionId}`;
}

// Renders one tenant-configured question according to its type. Purely
// presentational: the form owns the answer state and validation.
export default function EnquiryQuestionField({ question, value, error, onChange }: {
  question: PublicEnquiryQuestion;
  value: AnswerValue | undefined;
  error?: string;
  onChange: (value: AnswerValue) => void;
}) {
  const id = fieldDomId(question.id);
  const text = typeof value === "string" ? value : "";
  const label = <>{question.questionText}{question.isRequired && <span className="text-red-600"> *</span>}</>;
  const describedBy = error ? `${id}-error` : undefined;
  const errorMessage = error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-600">{error}</p>;

  if (question.questionType === "short_text") {
    return <div><label htmlFor={id} className={enquiryLabelClass}>{label}</label><input id={id} className={enquiryInputClass} type="text" maxLength={300} value={text} onChange={(event) => onChange(event.target.value)} aria-invalid={!!error} aria-describedby={describedBy} />{errorMessage}</div>;
  }
  if (question.questionType === "long_text") {
    return <div><label htmlFor={id} className={enquiryLabelClass}>{label}</label><textarea id={id} className={`${enquiryInputClass} min-h-24 resize-y`} rows={3} maxLength={2000} value={text} onChange={(event) => onChange(event.target.value)} aria-invalid={!!error} aria-describedby={describedBy} />{errorMessage}</div>;
  }
  if (question.questionType === "number") {
    return <div><label htmlFor={id} className={enquiryLabelClass}>{label}</label><input id={id} className={enquiryInputClass} type="number" inputMode="decimal" step="any" value={text} onChange={(event) => onChange(event.target.value)} aria-invalid={!!error} aria-describedby={describedBy} />{errorMessage}</div>;
  }
  if (question.questionType === "date") {
    return <div><label htmlFor={id} className={enquiryLabelClass}>{label}</label><input id={id} className={enquiryInputClass} type="date" value={text} onChange={(event) => onChange(event.target.value)} aria-invalid={!!error} aria-describedby={describedBy} />{errorMessage}</div>;
  }
  if (question.questionType === "single_select" && question.options.length > MAX_RADIO_OPTIONS) {
    return <div><label htmlFor={id} className={enquiryLabelClass}>{label}</label><select id={id} className={enquiryInputClass} value={text} onChange={(event) => onChange(event.target.value)} aria-invalid={!!error} aria-describedby={describedBy}><option value="">Select an option</option>{question.options.map((option) => <option key={option} value={option}>{option}</option>)}</select>{errorMessage}</div>;
  }

  // Grouped controls (yes/no, radios, checkboxes) — a fieldset so screen
  // readers announce the question with each choice. `id` sits on the
  // fieldset so the form can scroll the first invalid question into view.
  const options = question.questionType === "yes_no" ? ["Yes", "No"] : question.options;
  const multiple = question.questionType === "multi_select";
  const picked = Array.isArray(value) ? value : [];
  return (
    <fieldset id={id} tabIndex={-1} aria-describedby={describedBy} className="min-w-0 outline-none">
      <legend className={enquiryLabelClass}>{label}</legend>
      <div className={`mt-1.5 grid gap-2 ${question.questionType === "yes_no" ? "grid-cols-2 sm:max-w-xs" : "sm:grid-cols-2"}`}>
        {options.map((option) => (
          <label key={option} className={choiceClass}>
            {multiple
              ? <input type="checkbox" className={controlClass} checked={picked.includes(option)} onChange={(event) => onChange(event.target.checked ? [...picked, option] : picked.filter((item) => item !== option))} />
              : <input type="radio" className={controlClass} name={id} checked={text === option} onChange={() => onChange(option)} />}
            <span className="min-w-0 break-words">{option}</span>
          </label>
        ))}
      </div>
      {errorMessage}
    </fieldset>
  );
}
