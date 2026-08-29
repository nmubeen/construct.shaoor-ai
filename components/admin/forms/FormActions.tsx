"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { FaArrowLeft, FaFloppyDisk } from "react-icons/fa6";

import Button from "@/components/admin/primitives/Button";

interface FormActionsProps {
  submitLabel?: string;
  cancelLabel?: string;
  cancelHref?: string;
  sticky?: boolean;
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
      loading={pending}
      leftIcon={!pending ? <FaFloppyDisk /> : undefined}
    >
      {pending ? "Saving..." : label}
    </Button>
  );
}

export default function FormActions({
  submitLabel = "Save",
  cancelLabel = "Cancel",
  cancelHref,
  sticky = false,
}: FormActionsProps) {
  return (
    <div
      className={[
        "mt-8 flex items-center justify-end gap-3 border-t pt-6",
        sticky
          ? "sticky bottom-0 z-20 bg-white py-4"
          : "",
      ].join(" ")}
    >
      {cancelHref && (
        <Button
          asChild
          variant="outline"
          leftIcon={<FaArrowLeft />}
        >
          <Link href={cancelHref}>
            {cancelLabel}
          </Link>
        </Button>
      )}

      <SubmitButton label={submitLabel} />
    </div>
  );
}