import Link from "next/link";
import Image from "next/image";
import type { Project } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FaPen, FaTrash } from "react-icons/fa6";
import { deleteProject } from "@/lib/actions/project.actions";
import PageHeader from "@/components/admin/common/PageHeader";
import PageCard from "@/components/admin/common/PageCard";
import StatusBadge from "@/components/admin/common/StatusBadge";
import EmptyState from "@/components/admin/common/EmptyState";

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
        <StatusBadge
          status={project.status}
        />
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

    <PageHeader
      title="Projects"
      description="Manage your portfolio projects."
      action={{
        label: "New Project",
        href: "/admin/projects/new",
      }}
    />

      <PageCard className="overflow-hidden p-0">

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
              <td colSpan={8}>
                <EmptyState
                  title="No Projects Yet"
                  description="Create your first project to showcase your work."
                  actionLabel="New Project"
                  actionHref="/admin/projects/new"
                />
              </td>
            </tr>
            )}

          </tbody>

        </table>

      </PageCard>

    </div>
  );
}