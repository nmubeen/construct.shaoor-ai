"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { FaSpinner } from "react-icons/fa6";

import Button from "@/components/admin/primitives/Button";

interface FormActionsProps {
  cancelHref: string;
  submitLabel?: string;
}

function SubmitButton({
  label,
}: {
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
    >
      {pending && (
        <FaSpinner className="animate-spin" />
      )}

      {pending ? "Saving..." : label}
    </Button>
  );
}

export default function FormActions({
  cancelHref,
  submitLabel = "Save",
}: FormActionsProps) {
  return (
    <div className="sticky bottom-0 z-30 mt-8 border-t bg-white/90 backdrop-blur">
      <div className="flex items-center justify-end gap-3 px-6 py-4">

        <Link
          href={cancelHref}
          className="inline-flex items-center justify-center rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          Cancel
        </Link>

        <SubmitButton
          label={submitLabel}
        />

      </div>
    </div>
  );
}