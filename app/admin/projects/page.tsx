import Link from "next/link";
import Image from "next/image";
import type { Project } from "@prisma/client";
import { FaPlus } from "react-icons/fa6";

import { prisma } from "@/lib/prisma";
import { deleteProject } from "@/lib/actions/project.actions";

import AdminPage from "@/components/admin/layout/AdminPage";

import DataTable from "@/components/admin/table/DataTable";
import TableToolbar from "@/components/admin/table/TableToolbar";
import SearchBar from "@/components/admin/table/SearchBar";
import StatusBadge from "@/components/admin/table/StatusBadge";
import ActionButtons from "@/components/admin/table/ActionButtons";
import EmptyState from "@/components/admin/table/EmptyState";

function ProjectRow(project: Project) {
  return (
    <tr
      key={project.id}
      className="border-b transition hover:bg-slate-50"
    >
      <td className="p-4">
        <Image
          src={
            project.coverImage ??
            "/images/projects/default.jpg"
          }
          alt={project.title}
          width={90}
          height={60}
          className="rounded-lg border object-cover"
        />
      </td>

      <td className="p-4">
        <div className="font-semibold text-slate-900">
          {project.title}
        </div>

        <div className="text-sm text-slate-500">
          {project.client || "—"}
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
        {project.location || "—"}
      </td>

      <td className="p-4">
        {project.year || "—"}
      </td>

      <td className="p-4 text-center text-lg">
        {project.featured ? "⭐" : "—"}
      </td>

      <td className="p-4">
        <ActionButtons
          editHref={`/admin/projects/${project.id}`}
          confirmTitle="Delete Project"
          confirmMessage={`Are you sure you want to delete "${project.title}"? This action cannot be undone.`}
          deleteEntity="project"
          onDelete={async () => {
            "use server";

            await deleteProject(project.id);
          }}
        />
      </td>
    </tr>
  );
}

export default async function ProjectsPage() {
  const projects =
    await prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

  return (
    <AdminPage
      title="Projects"
      description="Manage your portfolio projects."
      action={
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <FaPlus />
          <span>New Project</span>
        </Link>
      }
    >
      <TableToolbar
        search={
          <SearchBar
            placeholder="Search projects..."
          />
        }
      />

      <DataTable>
        <thead className="bg-slate-100">
          <tr className="text-left text-sm font-semibold text-slate-700">
            <th className="p-4">
              Cover
            </th>

            <th className="p-4">
              Project
            </th>

            <th className="p-4">
              Category
            </th>

            <th className="p-4">
              Status
            </th>

            <th className="p-4">
              Location
            </th>

            <th className="p-4">
              Year
            </th>

            <th className="p-4 text-center">
              Featured
            </th>

            <th className="p-4">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {projects.length > 0 ? (
            projects.map(ProjectRow)
          ) : (
            <tr>
              <td colSpan={8}>
                <EmptyState
                  title="No Projects Yet"
                  description="Create your first project."
                  buttonLabel="New Project"
                  buttonHref="/admin/projects/new"
                />
              </td>
            </tr>
          )}
        </tbody>
      </DataTable>
    </AdminPage>
  );
}
