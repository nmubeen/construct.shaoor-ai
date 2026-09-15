import { ReactNode } from "react";

interface AdminCardProps {
  children: ReactNode;
}

export default function AdminCard({
  children,
}: AdminCardProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-(image:--gradient-form-bg) shadow-sm">
      {children}
    </div>
  );
}