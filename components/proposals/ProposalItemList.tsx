"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useRef, useState, useTransition } from "react";

// Generic reorder-with-arrows list, shared by the portfolio and
// testimonial pickers on the proposal editor — same up/down-arrow +
// optimistic-reorder-with-rollback pattern already used for enquiry
// questions (components/dashboard/services/EnquiryQuestionList.tsx).
//
// Each item carries its own pre-rendered `content` (a ReactNode built in
// the server page), rather than a `renderItem` render-prop function —
// this component is rendered from a Server Component, and only Server
// Actions and serializable data (including JSX) can cross that
// boundary; a plain rendering closure can't, which is what was actually
// behind the "functions cannot be passed directly to Client Components"
// error (reorderAction/removeAction needed the same treatment, already
// fixed as named "use server" functions — this was the second instance
// of the same underlying issue, not yet reached because reorderAction
// failed first).
export function ProposalItemList<T extends { id: string; content: React.ReactNode }>({
  items: initialItems,
  reorderAction,
  removeAction,
  removeLabel,
}: {
  items: T[];
  reorderAction: (orderedIds: string[]) => Promise<{ error?: string }>;
  removeAction: (id: string) => void | Promise<void>;
  removeLabel: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState("");
  const [, startSaving] = useTransition();
  const savedIds = useRef(initialItems.map((item) => item.id));

  function persist(next: T[]) {
    const ids = next.map((item) => item.id);
    if (ids.join() === savedIds.current.join()) return;
    setError("");
    startSaving(async () => {
      const result = await reorderAction(ids);
      if (result.error) {
        setError(result.error);
        setItems((current) => savedIds.current.flatMap((id) => current.filter((item) => item.id === id)));
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

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-3">
          <div className="flex shrink-0 flex-col">
            <button type="button" disabled={index === 0} onClick={() => moveBy(index, -1)} className="grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label="Move up"><ChevronUp className="size-4" /></button>
            <button type="button" disabled={index === items.length - 1} onClick={() => moveBy(index, 1)} className="grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label="Move down"><ChevronDown className="size-4" /></button>
          </div>
          <div className="min-w-0 flex-1">{item.content}</div>
          <button type="button" onClick={() => { setItems((current) => current.filter((i) => i.id !== item.id)); void removeAction(item.id); }} className="shrink-0 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">{removeLabel}</button>
        </div>
      ))}
    </div>
  );
}
