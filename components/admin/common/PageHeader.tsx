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
    <div className="mb-8 flex flex-col gap-5 border-b border-[#dce5da] pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#094136]">
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
          className="inline-flex items-center gap-2 rounded-xl bg-[#094136] px-5 py-3 text-sm font-semibold !text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#7D9D76] hover:shadow-md"
        >
          {action.icon}
          {action.label}
        </Link>
      )}
    </div>
  );
}
