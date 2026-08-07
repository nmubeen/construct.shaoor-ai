"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaTrash } from "react-icons/fa6";

import ConfirmDialog from "@/components/admin/feedback/ConfirmDialog";
import { deleteGallery } from "@/lib/actions/gallery.actions";
import { Entity, Messages } from "@/lib/messages";
import { notify } from "@/lib/toast";

interface DeleteGalleryButtonProps {
  id: number;
}

export default function DeleteGalleryButton({ id }: DeleteGalleryButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const deleteAction = deleteGallery.bind(null, id);

  async function handleDelete() {
    try {
      await deleteAction();
      setOpen(false);
      router.refresh();
      notify.success(Messages.deleted(Entity.gallery));
    } catch (error) {
      notify.error(error instanceof Error ? error.message : Messages.deleteFailed);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-red-600 transition hover:text-red-800"
        title="Delete"
      >
        <FaTrash />
      </button>

      <ConfirmDialog
        open={open}
        title="Delete Gallery"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
