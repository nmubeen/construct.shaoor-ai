"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

import { saveEnquiryQuestionAction } from "@/lib/actions/construct-enquiry-question.actions";
import { hasOptions, MAX_OPTION_LENGTH, MAX_OPTIONS, MAX_QUESTION_LENGTH, QUESTION_TYPES, QUESTION_TYPE_LABELS, type QuestionType } from "@/lib/enquiry/questions";

const input = "mt-1.5 w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#7D9D76] focus:ring-4 focus:ring-[#7D9D76]/25";

export type EditableQuestion = { id: string; questionText: string; questionType: QuestionType; options: string[]; isRequired: boolean; isActive: boolean };

// Owns only what needs to survive across "Save & Add New" — everything
// else (question type, options, the action's own pending/error state)
// resets for free by remounting <EnquiryQuestionFields> under a bumped
// key, rather than by hand-resetting each piece of state.
export function EnquiryQuestionEditor({ serviceId, question, cancelHref }: { serviceId: string; question?: EditableQuestion; cancelHref: string }) {
  const router = useRouter();
  const [resetKey, setResetKey] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  return (
    <EnquiryQuestionFields
      key={resetKey}
      serviceId={serviceId}
      question={question}
      cancelHref={cancelHref}
      justAdded={justAdded}
      onDirty={() => setJustAdded(false)}
      onSaved={() => router.push(`${cancelHref}?saved=1`)}
      onSavedAndAddAnother={() => {
        setJustAdded(true);
        setResetKey((key) => key + 1);
        router.refresh(); // picks up the new question in the list below, without leaving this form
      }}
    />
  );
}

// Add / edit one question. Options are plain text inputs sharing the name
// "options" (the server reads them in order), each with a stable key so
// removing one in the middle doesn't shuffle what's typed in the others.
function EnquiryQuestionFields({ serviceId, question, cancelHref, justAdded, onDirty, onSaved, onSavedAndAddAnother }: {
  serviceId: string;
  question?: EditableQuestion;
  cancelHref: string;
  justAdded: boolean;
  onDirty: () => void;
  onSaved: () => void;
  onSavedAndAddAnother: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveEnquiryQuestionAction, null);
  // The action itself only returns state — it doesn't redirect() (that
  // combination, from an action bound with useActionState, was surfacing
  // to the client as an uncaught error even though the save had already
  // succeeded, see saveEnquiryQuestionAction). This reacts to a plain
  // successful result instead.
  useEffect(() => {
    if (!state || !("ok" in state)) return;
    if (state.intent === "save-and-add") onSavedAndAddAnother();
    else onSaved();
  }, [state, onSaved, onSavedAndAddAnother]);

  const [type, setType] = useState<QuestionType>(question?.questionType ?? "short_text");
  const [nextKey, setNextKey] = useState(() => (question?.options.length ?? 0) + 1);
  // Key of the option input that should grab the cursor once it renders —
  // set when an option is added, or when switching to a select type reveals
  // the list. A ref (not state) so it fires once and never steals focus on
  // later re-renders while typing elsewhere.
  const focusOptionKey = useRef<number | null>(null);
  const [options, setOptions] = useState<{ key: number; value: string }[]>(() => {
    const initial = question?.options ?? [];
    return (initial.length > 0 ? initial : [""]).map((value, key) => ({ key, value }));
  });

  return (
    <form action={formAction} onInputCapture={onDirty} onChangeCapture={onDirty} className="mb-6 space-y-4 rounded-lg border border-slate-200 bg-(image:--gradient-form-bg) p-6 shadow-sm">
      <h2 className="font-bold text-(--color-primary-text)">{question ? "Edit question" : "Add question"}</h2>
      <input type="hidden" name="serviceId" value={serviceId} />
      {question && <input type="hidden" name="id" value={question.id} />}
      {state && "error" in state && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      {justAdded && <p role="status" className="rounded-md border border-[#7D9D76]/40 bg-[#eef3ec] p-3 text-sm font-semibold text-(--color-primary-text)">Question added. Add the next one below, or Cancel when you&apos;re done.</p>}

      <label className="block text-sm font-semibold text-slate-700">Question
        <input className={input} name="questionText" autoFocus={!question} defaultValue={question?.questionText} required minLength={3} maxLength={MAX_QUESTION_LENGTH} placeholder="e.g. What type of property is this?" />
      </label>

      <label className="block text-sm font-semibold text-slate-700">Question type
        <select className={input} name="questionType" value={type} onChange={(event) => {
          const next = event.target.value as QuestionType;
          if (hasOptions(next) && !hasOptions(type)) focusOptionKey.current = options[0]?.key ?? null;
          setType(next);
        }}>
          {QUESTION_TYPES.map((value) => <option key={value} value={value}>{QUESTION_TYPE_LABELS[value]}</option>)}
        </select>
      </label>

      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" name="isRequired" defaultChecked={question?.isRequired ?? false} className="size-4" />Required</label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" name="isActive" defaultChecked={question?.isActive ?? true} className="size-4" />Active (shown on the website)</label>
      </div>

      {hasOptions(type) && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-slate-700">Answer options</legend>
          {options.map((option, index) => (
            <div key={option.key} className="flex gap-2">
              <input className={`${input} mt-0`} name="options" value={option.value} maxLength={MAX_OPTION_LENGTH} aria-label={`Option ${index + 1}`} ref={(element) => { if (element && focusOptionKey.current === option.key) { focusOptionKey.current = null; element.focus(); } }} placeholder={`Option ${index + 1}`} onChange={(event) => setOptions((current) => current.map((item) => item.key === option.key ? { ...item, value: event.target.value } : item))} />
              <button type="button" disabled={options.length === 1} onClick={() => setOptions((current) => current.filter((item) => item.key !== option.key))} className="shrink-0 rounded-md border border-slate-300 px-3 text-sm font-semibold disabled:opacity-40">Remove</button>
            </div>
          ))}
          <button type="button" disabled={options.length >= MAX_OPTIONS} onClick={() => { focusOptionKey.current = nextKey; setOptions((current) => [...current, { key: nextKey, value: "" }]); setNextKey((key) => key + 1); }} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40">+ Add option</button>
        </fieldset>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <Link href={cancelHref} className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold">Cancel</Link>
        {/* Only offered while adding: saves this question and reopens a
            blank form for the next one, for building out a questionnaire
            without a round trip back to the list each time. */}
        {!question && (
          <button type="submit" name="intent" value="save-and-add" disabled={pending} className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            {pending ? "Saving..." : "Save & Add New"}
          </button>
        )}
        <button type="submit" name="intent" value="save" disabled={pending} className="rounded-md bg-(image:--gradient-button-bg) px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60">
          {pending ? "Saving..." : question ? "Save changes" : "Save question"}
        </button>
      </div>
    </form>
  );
}
