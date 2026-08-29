"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FaPlus, FaTrash } from "react-icons/fa6";
import ConfirmDialog from "@/components/admin/feedback/ConfirmDialog";

import {
  addHighlight,
  deleteHighlight,
} from "@/lib/actions/highlight.actions";
import { notify } from "@/lib/toast";
import { Entity, Messages } from "@/lib/messages";

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
  const [open, setOpen] = useState(false);
  const [selectedHighlightId, setSelectedHighlightId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
        notify.success(Messages.created(Entity.highlight));
      } catch (error) {
        notify.error(
          error instanceof Error
            ? error.message
            : "Unable to add highlight."
        );
      }
    });
  }

  function requestRemove(id: number) {
    setSelectedHighlightId(id);
    setOpen(true);
  }

  async function confirmRemove() {
    if (selectedHighlightId === null) return;

    try {
      setDeleteLoading(true);

      await deleteHighlight(selectedHighlightId);

      router.refresh();
      notify.success(Messages.deleted(Entity.highlight));

      setOpen(false);
      setSelectedHighlightId(null);
    } catch (error) {
      notify.error(
        error instanceof Error
          ? error.message
          : "Unable to delete highlight."
      );
    } finally {
      setDeleteLoading(false);
    }
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
                  requestRemove(highlight.id)
                }
                className="text-red-600 hover:text-red-800"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={open}
        loading={deleteLoading}
        title="Delete Highlight"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => {
          if (deleteLoading) return;

          setOpen(false);
          setSelectedHighlightId(null);
        }}
        onConfirm={confirmRemove}
      />
    </section>
  );
}
