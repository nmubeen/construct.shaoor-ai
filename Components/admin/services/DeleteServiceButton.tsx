"use client";

import { useRef } from "react";
import { deleteService } from "@/lib/actions/service.actions";

interface Props {
  id: string;
}

export default function DeleteServiceButton({
  id,
}: Props) {
  const formRef =
    useRef<HTMLFormElement>(null);

  function handleClick() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this service?\n\nThis action cannot be undone."
    );

    if (!confirmed) return;

    formRef.current?.requestSubmit();
  }

  const deleteAction =
    deleteService.bind(null, id);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="text-red-600 hover:text-red-800"
        title="Delete Service"
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