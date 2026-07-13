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
      <button type="submit" className="text-red-600">
        <FaTrash />
      </button>
    </form>
  );
}

function renderProjectRow(project: Project) {
  return (
    <tr key={project.id} className="border-t hover:bg-slate-50">
      <td className="p-4">
        <Image
          src={project.coverImage || "/images/projects/default.jpg"}
          alt={project.title}
          width={80}
          height={60}
          className="rounded-md object-cover"
        />
      </td>

      <td>{project.title}</td>

      <td>{project.category}</td>

      <td>
        <span
          className={`rounded-full px-3 py-1 text-sm ${
            project.status === "Completed"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {project.status}
        </span>
      </td>

      <td>{project.client}</td>

      <td>{project.year}</td>

      <td>{project.featured ? "⭐" : ""}</td>

      <td>
        <div className="flex gap-4">
          <Link href={`/admin/projects/${project.id}`} className="text-blue-600">
            <FaPen />
          </Link>

          <DeleteProjectButton id={project.id} />
        </div>
      </td>
    </tr>
  );
}

export default async function ProjectsPage() {
  const projects: Project[] = await prisma.project.findMany({
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
          className="rounded-lg bg-[#0E4A7B] px-5 py-3 text-white"
        >
          + New Project
        </Link>

      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="p-4 text-left">Cover</th>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Client</th>
              <th>Year</th>
              <th>Featured</th>
              <th>Actions</th>

            </tr>

          </thead>

          <tbody>

            {projects.map(renderProjectRow)}

          </tbody>

        </table>

      </div>

    </div>
  );
}