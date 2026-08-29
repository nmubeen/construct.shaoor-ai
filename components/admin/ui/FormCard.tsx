import { ReactNode } from "react";

interface FormCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function FormCard({
  title,
  description,
  children,
}: FormCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-8 py-6">
        <h2 className="text-xl font-semibold text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-2 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="space-y-6 p-8">
        {children}
      </div>
    </section>
  );
}