import { ReactNode } from "react";

interface AdminPageProps {
  children: ReactNode;
}

export default function AdminPage({
  children,
}: AdminPageProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 py-8">
      {children}
    </div>
  );
}