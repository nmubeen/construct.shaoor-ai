import Link from "next/link";
import type { Project } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export default async function RecentProjects() {
  const projects: Project[] = await prisma.project.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">

      <h2 className="mb-6 text-xl font-bold">
        Recent Projects
      </h2>

      <div className="space-y-4">

        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/admin/projects/${project.id}`}
            className="block rounded-lg border p-4 hover:bg-slate-50"
          >
            <div className="font-semibold">
              {project.title}
            </div>

            <div className="text-sm text-slate-500">
              {project.client}
            </div>
          </Link>
        ))}

        {projects.length === 0 && (
          <p className="text-slate-500">
            No projects yet.
          </p>
        )}

      </div>

    </div>
  );
}