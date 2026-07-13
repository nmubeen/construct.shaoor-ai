"use client";

import { useTransition } from "react";
import { deleteProject } from "@/lib/actions/project.actions";

interface Props {
  id: number;
}

export default function DeleteProjectButton({ id }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?\n\nThis action cannot be undone."
    );

    if (!confirmed) return;

    startTransition(async () => {
      await deleteProject(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-600 hover:text-red-800 disabled:opacity-50"
      title="Delete Project"
    >
      {isPending ? "Deleting..." : "🗑"}
    </button>
  );
}