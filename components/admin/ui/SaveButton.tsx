"use client";

import { useFormStatus } from "react-dom";

export default function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-blue-600 px-8 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save Changes"}
    </button>
  );
}