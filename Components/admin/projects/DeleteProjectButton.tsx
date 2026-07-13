"use client";

import { useRef } from "react";
import { deleteProject } from "@/lib/actions/project.actions";

interface Props {
  id: number;
}

export default function DeleteProjectButton({ id }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleClick() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?\n\nThis action cannot be undone."
    );

    if (!confirmed) return;

    formRef.current?.requestSubmit();
  }

  const deleteAction = deleteProject.bind(null, id);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="text-red-600 hover:text-red-800"
        title="Delete Project"
      >
        🗑
      </button>

      <form
        ref={formRef}
        action={deleteAction}
        className="hidden"
      />
    </>
  );
}