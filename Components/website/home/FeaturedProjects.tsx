import Image from "next/image";
import Link from "next/link";

import { prisma } from "@/lib/prisma";

export default async function FeaturedProjects() {
  const projects = await prisma.project.findMany({
    where: {
      featured: true,
    },
    orderBy: {
      year: "desc",
    },
    take: 3,
  });

  if (projects.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-16 text-center">

          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-(--primary)">
            Our Work
          </span>

          <h2 className="mt-3 text-4xl font-bold">
            Featured Projects
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg text-slate-600">
            A selection of projects that reflect our commitment
            to quality, innovation, and timely delivery.
          </p>

        </div>

        <div className="grid gap-8 lg:grid-cols-3">

          {projects.map((project) => (
            <article
              key={project.id}
              className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
            >
              <Link href={`/projects/${project.slug}`}>

                <div className="relative h-72 overflow-hidden">

                  <Image
                    src={project.coverImage}
                    alt={project.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
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

                  <h3 className="text-2xl font-bold transition group-hover:text-(--primary)">
                    {project.title}
                  </h3>

                  <p className="text-slate-500">
                    {project.location}
                  </p>

                  <p className="line-clamp-3 text-sm leading-7 text-slate-600">
                    {project.description}
                  </p>

                  <div className="pt-2 font-semibold text-(--primary)">
                    View Project →
                  </div>

                </div>

              </Link>
            </article>
          ))}

        </div>

        <div className="mt-16 text-center">

          <Link
            href="/projects"
            className="inline-flex rounded-lg bg-(--primary) px-8 py-4 font-semibold text-white transition hover:bg-(--primary-dark)"
          >
            View All Projects
          </Link>

        </div>

      </div>
    </section>
  );
}