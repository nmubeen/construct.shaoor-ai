import { ReactNode } from "react";

interface PageSectionProps {
  children: ReactNode;
}

export default function PageSection({
  children,
}: PageSectionProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      {children}
    </div>
  );
}