import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getSeoPageMetadata } from "@/lib/seo";
import PageHero from "@/components/website/shared/PageHero";
import Container from "@/components/ui/Container";
import { websiteDesign } from "@/components/website/shared/design";

export async function generateMetadata(): Promise<Metadata> {
  return getSeoPageMetadata({
    pageKey: "projects",
    routePath: "/projects",
  });
}

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
      <PageHero
        title="Our Projects"
        subtitle="Our Portfolio"
        description="Explore our completed and ongoing construction projects."
      />

      <section className={websiteDesign.sectionY}>
        <Container>

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
                    className={`${websiteDesign.card} w-95`}
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
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${project.status === "Completed"
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
                        className="inline-flex font-semibold text-primary hover:underline"
                      >
                        View Project →
                      </Link>

                    </div>

                  </article>

                );

              })}

            </div>

          )}

        </Container>
      </section>

    </main>
  );
}
