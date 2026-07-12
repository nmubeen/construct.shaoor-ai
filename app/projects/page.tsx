import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <>
      <div className="mb-10 flex items-center justify-between">

        <h1 className="text-4xl font-bold">
          Projects
        </h1>

        <Link
          href="/admin/projects/new"
          className="rounded-lg bg-[#0E4A7B] px-5 py-3 font-semibold text-white"
        >
          + New Project
        </Link>

      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="p-4 text-left">Title</th>

              <th>Status</th>

              <th>Category</th>

              <th>Actions</th>

            </tr>

          </thead>

          <tbody>

            {projects.map((project) => (

              <tr
                key={project.id}
                className="border-t"
              >

                <td className="p-4">
                  {project.title}
                </td>

                <td>{project.status}</td>

                <td>{project.category}</td>

                <td className="space-x-3">

                  <Link
                    href={`/admin/projects/${project.id}`}
                    className="text-blue-700"
                  >
                    Edit
                  </Link>

                  <button className="text-red-600">
                    Delete
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </>
  );
}