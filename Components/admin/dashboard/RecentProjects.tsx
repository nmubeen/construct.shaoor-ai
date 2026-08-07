import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";

import DashboardPanel from "./DashboardPanel";

interface Project {
  id: number;
  title: string;
  clientName?: string | null;
  status?: string | null;
  updatedAt: Date;
}

interface Props {
  projects: Project[];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

function getStatusClasses(status?: string | null) {
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-700";

    case "in progress":
      return "bg-blue-100 text-blue-700";

    case "planning":
      return "bg-yellow-100 text-yellow-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function RecentProjects({
  projects,
}: Props) {
  return (
    <DashboardPanel
      title="Recent Projects"
      subtitle="Recently updated projects"
      action={
        <Link
          href="/admin/projects"
          className="text-sm font-medium text-[#0E4A7B] hover:underline"
        >
          View All
        </Link>
      }
    >
      <div className="space-y-4">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/admin/projects/${project.id}/edit`}
            className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50"
          >
            <div>
              <h3 className="font-semibold text-slate-900">
                {project.title}
              </h3>

              {project.clientName && (
                <p className="mt-1 text-sm text-slate-500">
                  {project.clientName}
                </p>
              )}
            </div>

            <div className="text-right">
              {project.status && (
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(
                    project.status
                  )}`}
                >
                  {project.status}
                </span>
              )}

              <div className="mt-2 flex items-center justify-end gap-2 text-sm text-slate-500">
                {formatDate(project.updatedAt)}
                <FaArrowRight />
              </div>
            </div>
          </Link>
        ))}

        {projects.length === 0 && (
          <div className="py-10 text-center text-slate-500">
            No projects found.
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}