interface StatusBadgeProps {
  status: string;
}

const styles: Record<string, string> = {
  Completed: "bg-green-100 text-green-700",
  Ongoing: "bg-yellow-100 text-yellow-700",
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-slate-200 text-slate-700",
  Draft: "bg-orange-100 text-orange-700",
  Published: "bg-blue-100 text-blue-700",
};

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  const className =
    styles[status] ??
    "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {status}
    </span>
  );
}