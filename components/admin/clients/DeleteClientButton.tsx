"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaTrash } from "react-icons/fa6";

import { deleteClient } from "@/lib/actions/client.actions";
import ConfirmDialog from "@/components/admin/feedback/ConfirmDialog";
import { notify } from "@/lib/toast";
import { Entity, Messages } from "@/lib/messages";

interface Props {
  id: number;
}

export default function DeleteClientButton({ id }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const deleteAction = deleteClient.bind(null, id);

  async function handleDelete() {
    try {
      await deleteAction();
      setOpen(false);
      router.refresh();
      notify.success(Messages.deleted(Entity.client));
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
        title="Delete Client"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
