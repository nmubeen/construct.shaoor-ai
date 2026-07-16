import Image from "next/image";
import Link from "next/link";

import { prisma } from "@/lib/prisma";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      gallery: {
        orderBy: {
          id: "asc",
        },
        take: 1,
      },
    },
    orderBy: {
      year: "desc",
    },
  });

  return (
    <main className="bg-white">

      {/* Hero */}

      <section className="bg-slate-900 py-10 text-white">
        <div className="mx-auto max-w-7xl px-6 text-center">

          <h1 className="text-4xl font-bold">
            Our Projects
          </h1>

          <p className="mx-auto mt-3 max-w-3xl text-lg text-slate-300">
            Explore our completed and ongoing construction projects.
          </p>

        </div>
      </section>

      {/* Projects */}

      <section className="mx-auto max-w-7xl px-6 py-16">

        {projects.length === 0 ? (

          <div className="rounded-xl border border-dashed p-16 text-center text-slate-500">
            No projects available.
          </div>

        ) : (

          <div className="mx-auto grid max-w-fit gap-10 md:grid-cols-2 xl:grid-cols-3">

            {projects.map((project) => {

              const image =
                project.coverImage &&
                project.coverImage !== "/images/projects/default.jpg"
                  ? project.coverImage
                  : project.gallery.length > 0
                    ? project.gallery[0].image
                    : "/images/projects/default.jpg";

              return (

                <article
                  key={project.id}
                  className="w-95 overflow-hidden rounded-2xl border bg-white shadow transition hover:-translate-y-1 hover:shadow-xl"
                >

                  <div className="relative h-64">

                    <Image
                      src={image}
                      alt={project.title}
                      fill
                      className="object-cover"
                    />

                  </div>

                  <div className="space-y-4 p-6">

                    <div className="flex items-center justify-between">

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                        {project.category}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          project.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {project.status}
                      </span>

                    </div>

                    <h2 className="text-2xl font-bold">
                      {project.title}
                    </h2>

                    <p className="text-slate-600">
                      {project.location}
                    </p>

                    <p className="line-clamp-3 text-sm text-slate-500">
                      {project.description}
                    </p>

                    <Link
                      href={`/projects/${project.slug}`}
                      className="inline-flex font-semibold text-[#0E4A7B] hover:underline"
                    >
                      View Project →
                    </Link>

                  </div>

                </article>

              );

            })}

          </div>

        )}

      </section>

    </main>
  );
}