import Link from "next/link";
import { ReactNode } from "react";

interface Action {
  label: string;
  href: string;
  icon?: ReactNode;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: Action;
}

export default function PageHeader({
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>

        {description && (
          <p className="mt-2 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>

      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {action.icon}
          {action.label}
        </Link>
      )}
    </div>
  );
}