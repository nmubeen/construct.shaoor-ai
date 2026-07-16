import Link from "next/link";

interface FormActionsProps {
  cancelHref: string;
  submitLabel: string;
}

export default function FormActions({
  cancelHref,
  submitLabel,
}: FormActionsProps) {
  return (
    <div className="mt-8 flex justify-end gap-4 border-t border-slate-200 pt-6">

      <Link
        href={cancelHref}
        className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium hover:bg-slate-100"
      >
        Cancel
      </Link>

      <button
        type="submit"
        className="rounded-lg bg-[#0E4A7B] px-6 py-2.5 text-white hover:bg-[#0A365A]"
      >
        {submitLabel}
      </button>

    </div>
  );
}