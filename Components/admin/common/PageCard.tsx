import { ReactNode } from "react";

interface PageCardProps {
  children: ReactNode;
  className?: string;
}

export default function PageCard({
  children,
  className = "",
}: PageCardProps) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-8 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}