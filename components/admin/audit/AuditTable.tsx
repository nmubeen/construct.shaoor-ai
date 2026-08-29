import type { AuditLog } from "@prisma/client";

interface AuditTableProps {
  logs: AuditLog[];
}

function actionClass(action: string) {
  if (action === "CREATE") {
    return "bg-green-100 text-green-700";
  }

  if (action === "UPDATE") {
    return "bg-blue-100 text-blue-700";
  }

  if (action === "DELETE") {
    return "bg-red-100 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AuditTable({ logs }: AuditTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Date</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Module</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Action</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Title</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Details</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200 bg-white">
          {logs.map((log) => (
            <tr key={log.id} className="transition hover:bg-slate-50">
              <td className="px-6 py-4 text-sm text-slate-600">{formatDate(log.createdAt)}</td>
              <td className="px-6 py-4 text-sm font-medium text-slate-800">{log.module}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${actionClass(log.action)}`}>
                  {log.action}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-800">{log.title}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{log.details || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
