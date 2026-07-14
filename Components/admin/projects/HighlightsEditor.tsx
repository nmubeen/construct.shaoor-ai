"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FaPlus, FaTrash } from "react-icons/fa6";

import {
  addHighlight,
  deleteHighlight,
} from "@/lib/actions/highlight.actions";

interface Highlight {
  id: number;
  text: string;
}

interface Props {
  projectId: number;
  highlights: Highlight[];
}

export default function HighlightsEditor({
  projectId,
  highlights,
}: Props) {
  const router = useRouter();

  const [value, setValue] = useState("");

  const [pending, startTransition] =
    useTransition();

  function add() {
    if (!value.trim()) return;

    startTransition(async () => {
      try {
        await addHighlight(
          projectId,
          value
        );

        setValue("");

        router.refresh();
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Unable to add highlight."
        );
      }
    });
  }

  function remove(id: number) {
    if (
      !window.confirm(
        "Delete this highlight?"
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteHighlight(id);

        router.refresh();
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Unable to delete highlight."
        );
      }
    });
  }

  return (
    <section className="rounded-xl border bg-white p-8 shadow">
      <h2 className="mb-6 text-2xl font-semibold">
        Project Highlights
      </h2>

      <div className="mb-6 flex gap-3">
        <input
          value={value}
          onChange={(e) =>
            setValue(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a highlight..."
          className="flex-1 rounded-lg border p-3"
        />

        <button
          type="button"
          disabled={pending}
          onClick={add}
          className="rounded-lg bg-[#0E4A7B] px-5 py-3 text-white disabled:opacity-50"
        >
          <FaPlus />
        </button>
      </div>

      {highlights.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-slate-500">
          No highlights added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {highlights.map((highlight) => (
            <div
              key={highlight.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <span>{highlight.text}</span>

              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  remove(highlight.id)
                }
                className="text-red-600 hover:text-red-800"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}