import { ReactNode } from "react";

interface AdminCardProps {
  children: ReactNode;
}

export default function AdminCard({
  children,
}: AdminCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {children}
    </div>
  );
}