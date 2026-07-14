import Link from "next/link";
import Image from "next/image";
import type { Project } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FaPen, FaTrash } from "react-icons/fa6";
import { deleteProject } from "@/lib/actions/project.actions";

function DeleteProjectButton({
  id,
}: {
  id: number;
}) {
  const action = deleteProject.bind(null, id);

  return (
    <form action={action}>
      <button
        type="submit"
        className="text-red-600 hover:text-red-800"
        title="Delete Project"
      >
        <FaTrash />
      </button>
    </form>
  );
}

function renderProjectRow(project: Project) {
  return (
    <tr
      key={project.id}
      className="border-t hover:bg-slate-50 transition-colors"
    >
      <td className="p-4">
        <Image
          src={
            project.coverImage ||
            "/images/projects/default.jpg"
          }
          alt={project.title}
          width={90}
          height={60}
          className="rounded-lg object-cover border"
        />
      </td>

      <td className="p-4">
        <div className="font-semibold">
          {project.title}
        </div>

        <div className="text-sm text-slate-500">
          {project.client}
        </div>
      </td>

      <td className="p-4">
        {project.category}
      </td>

      <td className="p-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            project.status === "Completed"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {project.status}
        </span>
      </td>

      <td className="p-4">
        {project.location}
      </td>

      <td className="p-4">
        {project.year}
      </td>

      <td className="p-4 text-center">
        {project.featured ? "⭐" : "—"}
      </td>

      <td className="p-4">
        <div className="flex items-center gap-4">

          <Link
            href={`/admin/projects/${project.id}`}
            className="text-blue-600 hover:text-blue-800"
            title="Edit Project"
          >
            <FaPen />
          </Link>

          <DeleteProjectButton
            id={project.id}
          />

        </div>
      </td>
    </tr>
  );
}

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-8">

      <div className="flex items-center justify-between">

        <h1 className="text-3xl font-bold">
          Projects
        </h1>

        <Link
          href="/admin/projects/new"
          className="rounded-lg bg-[#0E4A7B] px-5 py-3 text-white hover:bg-[#0A365A]"
        >
          + New Project
        </Link>

      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr className="text-left text-sm font-semibold text-slate-700">

              <th className="p-4">Cover</th>

              <th className="p-4">Project</th>

              <th className="p-4">Category</th>

              <th className="p-4">Status</th>

              <th className="p-4">Location</th>

              <th className="p-4">Year</th>

              <th className="p-4 text-center">
                Featured
              </th>

              <th className="p-4">Actions</th>

            </tr>

          </thead>

          <tbody>

            {projects.length > 0 ? (
              projects.map(renderProjectRow)
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="p-10 text-center text-slate-500"
                >
                  No projects found.
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}