"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaTrash } from "react-icons/fa6";

import ConfirmDialog from "@/components/admin/feedback/ConfirmDialog";

import { deleteMessage } from "@/lib/actions/message.actions";

import { notify } from "@/lib/toast";
import { Entity, Messages } from "@/lib/messages";

interface Props {
  id: number;
}

export default function DeleteMessageButton({ id }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    try {
      await deleteMessage(id);
      setOpen(false);
      router.push("/admin/messages");
      router.refresh();
      notify.success(Messages.deleted(Entity.message));
    } catch (error) {
      notify.error(error instanceof Error ? error.message : Messages.deleteFailed);
    }
  }

  return (
    <>
      <button
        type="button"
        title="Delete"
        onClick={() => setOpen(true)}
        className="text-red-600 transition hover:text-red-700"
      >
        <FaTrash size={18} />
      </button>

      <ConfirmDialog
        open={open}
        title="Delete Message"
        message="This message will be permanently deleted. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
