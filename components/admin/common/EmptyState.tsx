import Link from "next/link";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">

      {icon && (
        <div className="mb-5 text-5xl text-slate-300">
          {icon}
        </div>
      )}

      <h3 className="text-xl font-semibold text-slate-800">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-slate-500">
        {description}
      </p>

      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-6 rounded-lg bg-(image:--gradient-button-bg) px-5 py-3 text-white transition hover:brightness-110"
        >
          {actionLabel}
        </Link>
      )}

    </div>
  );
}