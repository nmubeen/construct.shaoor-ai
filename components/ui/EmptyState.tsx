import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-slate-500">{description}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}