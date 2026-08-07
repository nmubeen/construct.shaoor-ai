"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaPenToSquare,
  FaTrash,
} from "react-icons/fa6";

import ConfirmDialog from "@/components/admin/feedback/ConfirmDialog";
import { notify } from "@/lib/toast";
import { Entity, Messages } from "@/lib/messages";

interface ActionButtonsProps {
  editHref?: string;
  onDelete?: () => Promise<unknown> | unknown;
  deleteEntity?: keyof typeof Entity;
  editTitle?: string;
  deleteTitle?: string;
  confirmTitle?: string;
  confirmMessage?: string;
}

export default function ActionButtons({
  editHref,

  onDelete,
  deleteEntity,

  editTitle = "Edit",

  deleteTitle = "Delete",

  confirmTitle = "Delete Item",

  confirmMessage =
    "Are you sure you want to delete this item? This action cannot be undone.",
}: ActionButtonsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [loading, setLoading] =
    useState(false);

  async function handleDelete() {
    if (!onDelete) return;

    try {
      setLoading(true);

      const result = await onDelete();

      if (
        typeof result === "object" &&
        result !== null &&
        "success" in result &&
        result.success === false
      ) {
        throw new Error(
          "message" in result && typeof result.message === "string"
            ? result.message
            : Messages.deleteFailed
        );
      }

      setOpen(false);
      router.refresh();
      notify.success(deleteEntity ? Messages.deleted(deleteEntity) : Messages.deleted(Entity.project));
    } catch (error) {
      notify.error(error instanceof Error ? error.message : Messages.deleteFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-4">

        {editHref && (
          <Link
            href={editHref}
            title={editTitle}
            className="text-blue-600 transition hover:text-blue-800"
          >
            <FaPenToSquare className="text-lg" />
          </Link>
        )}

        {onDelete && (
          <button
            type="button"
            title={deleteTitle}
            onClick={() => setOpen(true)}
            className="text-red-600 transition hover:text-red-800"
          >
            <FaTrash className="text-lg" />
          </button>
        )}

      </div>

      <ConfirmDialog
        open={open}
        loading={loading}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
