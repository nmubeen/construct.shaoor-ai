"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProject } from "@/lib/actions/project.actions";
import ConfirmDialog from "@/components/admin/feedback/ConfirmDialog";
import { notify } from "@/lib/toast";
import { Entity, Messages } from "@/lib/messages";

interface Props {
  id: number;
}

export default function DeleteProjectButton({ id }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const deleteAction = deleteProject.bind(null, id);

  async function handleDelete() {
    try {
      const result = await deleteAction();
      if (!result.success) throw new Error(result.message);
      setOpen(false);
      router.refresh();
      notify.success(Messages.deleted(Entity.project));
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
        title="Delete Project"
      >
        🗑
      </button>

      <ConfirmDialog
        open={open}
        title="Delete Project"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
