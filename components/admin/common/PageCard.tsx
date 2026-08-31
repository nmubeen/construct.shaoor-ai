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
      className={`rounded-2xl border border-[#dce5da] bg-white p-5 shadow-[0_8px_24px_rgba(9,65,54,.06)] sm:p-8 ${className}`}
    >
      {children}
    </section>
  );
}
