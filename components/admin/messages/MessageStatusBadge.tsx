interface Props {
  status: "New" | "Read" | "Replied";
}

export default function MessageStatusBadge({
  status,
}: Props) {
  const styles = {
    New: "bg-blue-100 text-blue-800",
    Read: "bg-slate-100 text-slate-700",
    Replied: "bg-green-100 text-green-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}