"use client";

import { ChevronDown, ChevronUp, GripVertical, Pencil } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition, type DragEvent } from "react";

import { ConfirmActionButton } from "@/components/dashboard/settings/ConfirmActionButton";
import { deleteEnquiryQuestionAction, reorderEnquiryQuestionsAction, toggleEnquiryQuestionAction } from "@/lib/actions/construct-enquiry-question.actions";
import { QUESTION_TYPE_LABELS, type QuestionType } from "@/lib/enquiry/questions";

export type ListedQuestion = { id: string; questionText: string; questionType: QuestionType; options: string[]; isRequired: boolean; isActive: boolean };

const button = "rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40";
const iconButton = "grid size-9 place-items-center rounded-lg border border-slate-300 disabled:cursor-not-allowed disabled:opacity-40";

// The question list with two ways to reorder, both saved through the same
// action: the up/down arrows (work everywhere, including touch screens) and
// dragging a card by its grip (native HTML5 drag-and-drop, so no new
// dependency; it isn't supported by most touch browsers, hence the arrows).
// The order updates immediately and is rolled back if the save fails.
export function EnquiryQuestionList({ serviceId, base, canEdit, questions }: { serviceId: string; base: string; canEdit: boolean; questions: ListedQuestion[] }) {
  const [items, setItems] = useState(questions);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();
  // Order as last saved, to roll back to and to skip a save when a drag ends where it began.
  const savedIds = useRef(questions.map((question) => question.id));

  function persist(next: ListedQuestion[]) {
    const ids = next.map((question) => question.id);
    if (ids.join() === savedIds.current.join()) return;
    setError("");
    startSaving(async () => {
      const result = await reorderEnquiryQuestionsAction(serviceId, ids);
      if (result.error) {
        setError(result.error);
        setItems((current) => savedIds.current.flatMap((id) => current.filter((question) => question.id === id)));
      } else {
        savedIds.current = ids;
      }
    });
  }

  function moveBy(index: number, offset: -1 | 1) {
    const next = [...items];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    setItems(next);
    persist(next);
  }

  function handleDragOver(event: DragEvent, overId: string) {
    if (!draggingId) return;
    event.preventDefault();
    if (overId === draggingId) return;
    // Reorder live while hovering, so the card visibly slides into place.
    setItems((current) => {
      const from = current.findIndex((question) => question.id === draggingId);
      const to = current.findIndex((question) => question.id === overId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
  }

  function endDrag() {
    setDraggingId(null);
    persist(items);
  }

  return (
    <>
      {error && <p role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className={`grid gap-3 ${saving ? "opacity-80" : ""}`}>
        {items.map((question, index) => (
          <article
            key={question.id}
            draggable={canEdit}
            onDragStart={(event) => { setDraggingId(question.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", question.id); }}
            onDragOver={(event) => handleDragOver(event, question.id)}
            onDrop={(event) => event.preventDefault()}
            onDragEnd={endDrag}
            className={`rounded-lg border bg-white p-5 shadow-sm ${draggingId === question.id ? "border-dashed border-[#7D9D76] opacity-60" : "border-slate-200"} ${question.isActive ? "" : "bg-slate-50"}`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 gap-3">
                {canEdit && <GripVertical aria-hidden="true" className="mt-0.5 size-5 shrink-0 cursor-grab text-slate-400 active:cursor-grabbing" />}
                <div className={`min-w-0 ${question.isActive ? "" : "opacity-70"}`}>
                  <p className="font-bold text-slate-950"><span className="mr-2 text-slate-400">{index + 1}.</span>{question.questionText}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{QUESTION_TYPE_LABELS[question.questionType]}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{question.isRequired ? "Required" : "Optional"}</span><span className={`rounded-full px-2 py-0.5 ${question.isActive ? "bg-[#eef3ec] text-(--color-secondary-text-icon)" : "bg-red-50 text-red-700"}`}>{question.isActive ? "Active" : "Inactive"}</span></div>
                  {question.options.length > 0 && <p className="mt-2 text-sm text-slate-500">{question.options.join(" · ")}</p>}
                </div>
              </div>
              {canEdit && <div className="flex flex-wrap items-center gap-2">
                <button type="button" aria-label="Move up" title="Move up" className={iconButton} disabled={index === 0 || saving} onClick={() => moveBy(index, -1)}><ChevronUp className="size-4" /></button>
                <button type="button" aria-label="Move down" title="Move down" className={iconButton} disabled={index === items.length - 1 || saving} onClick={() => moveBy(index, 1)}><ChevronDown className="size-4" /></button>
                <Link href={`${base}?edit=${question.id}`} className={`${button} inline-flex items-center gap-2`}><Pencil className="size-4" />Edit</Link>
                <form action={toggleEnquiryQuestionAction}><input type="hidden" name="id" value={question.id} /><button className={button}>{question.isActive ? "Disable" : "Enable"}</button></form>
                <form action={deleteEnquiryQuestionAction}><input type="hidden" name="id" value={question.id} /><ConfirmActionButton message="Delete this question? Enquiries already received keep the answers they were given." className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">Delete</ConfirmActionButton></form>
              </div>}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
