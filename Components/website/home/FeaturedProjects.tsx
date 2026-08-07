import Image from "next/image";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import PageSection from "@/components/website/shared/PageSection";
import SectionHeader from "@/components/website/shared/SectionHeader";
import { websiteDesign } from "@/components/website/shared/design";

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
    <PageSection className="bg-white">
      <SectionHeader
        eyebrow="Our Work"
        title="Featured Projects"
        subtitle="A selection of projects that reflect our commitment to quality, innovation, and timely delivery."
        align="left"
      />

      <div className="py-4">
        <Link
          href="/projects"
          className={`${websiteDesign.primaryButton} text-white!`}
        >
          View All Projects
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">

          {projects.map((project) => (
            <article
              key={project.id}
              className={`group ${websiteDesign.card}`}
            >
              <Link href={`/projects/${project.slug}`}>

                <div className="relative h-72 overflow-hidden">

                  <Image
                    src={project.coverImage || "/images/no-image.webp"}
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

                  <h3 className="text-2xl font-bold transition group-hover:text-primary">
                    {project.title}
                  </h3>

                  <p className="text-slate-500">
                    {project.location}
                  </p>

                  <p className="line-clamp-3 text-sm leading-7 text-slate-600">
                    {project.description}
                  </p>

                  <div className="pt-2 font-semibold text-primary">
                    View Project →
                  </div>

                </div>

              </Link>
            </article>
          ))}

      </div>
    </PageSection>
  );
}