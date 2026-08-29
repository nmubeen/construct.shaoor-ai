"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteService } from "@/lib/actions/service.actions";
import ConfirmDialog from "@/components/admin/feedback/ConfirmDialog";
import { FaTrash } from "react-icons/fa6";
import { notify } from "@/lib/toast";
import { Entity, Messages } from "@/lib/messages";

interface Props {
  id: number;
}

export default function DeleteServiceButton({
  id,
}: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const deleteAction =
    deleteService.bind(null, id);

  async function handleDelete() {
    try {
      await deleteAction();
      setOpen(false);
      router.refresh();
      notify.success(Messages.deleted(Entity.service));
    } catch (error) {
      notify.error(error instanceof Error ? error.message : Messages.deleteFailed);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-red-600 hover:text-red-800"
        title="Delete Service"
      >
       <FaTrash size={18} />
      </button>

      <ConfirmDialog
        open={open}
        title="Delete Service"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
