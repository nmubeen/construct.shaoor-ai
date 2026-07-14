import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProjectPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: {
      slug,
    },
    include: {
      gallery: {
        orderBy: {
          id: "asc",
        },
      },
      highlights: {
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const relatedProjects = await prisma.project.findMany({
    where: {
      category: project.category,
      id: {
        not: project.id,
      },
    },
    take: 3,
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">

      {/* Breadcrumb */}

      <div className="mb-8 text-sm text-slate-500">
        <Link
          href="/projects"
          className="hover:text-[#0E4A7B]"
        >
          Projects
        </Link>

        {" / "}

        {project.title}
      </div>

      {/* Cover */}

      <div className="relative mb-12 h-125 overflow-hidden rounded-3xl">

        <Image
          src={project.coverImage}
          alt={project.title}
          fill
          priority
          className="object-cover"
        />

      </div>

      {/* Header */}

      <div className="mb-10">

        <div className="mb-4 flex flex-wrap gap-3">

          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm">
            {project.category}
          </span>

          <span
            className={`rounded-full px-4 py-2 text-sm ${
              project.status === "Completed"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {project.status}
          </span>

        </div>

        <h1 className="text-5xl font-bold">
          {project.title}
        </h1>

      </div>

      {/* Details */}

      <div className="mb-12 grid gap-8 md:grid-cols-4">

        <div>
          <div className="text-sm text-slate-500">
            Client
          </div>

          <div className="font-semibold">
            {project.client}
          </div>
        </div>

        <div>
          <div className="text-sm text-slate-500">
            Location
          </div>

          <div className="font-semibold">
            {project.location}
          </div>
        </div>

        <div>
          <div className="text-sm text-slate-500">
            Year
          </div>

          <div className="font-semibold">
            {project.year}
          </div>
        </div>

        <div>
          <div className="text-sm text-slate-500">
            Duration
          </div>

          <div className="font-semibold">
            {project.duration}
          </div>
        </div>

      </div>

      {/* Description */}

      <section className="mb-16">

        <h2 className="mb-6 text-3xl font-bold">
          About this Project
        </h2>

        <p className="whitespace-pre-line leading-8 text-slate-700">
          {project.description}
        </p>

      </section>

      {/* Highlights */}

      {project.highlights.length > 0 && (

        <section className="mb-16">

          <h2 className="mb-6 text-3xl font-bold">
            Highlights
          </h2>

          <div className="grid gap-4 md:grid-cols-2">

            {project.highlights.map(
              (highlight) => (
                <div
                  key={highlight.id}
                  className="rounded-xl border p-5"
                >
                  ✓ {highlight.text}
                </div>
              )
            )}

          </div>

        </section>

      )}

      {/* Gallery */}

      {project.gallery.length > 0 && (

        <section className="mb-16">

          <h2 className="mb-6 text-3xl font-bold">
            Gallery
          </h2>

          <div className="grid gap-6 md:grid-cols-3">

            {project.gallery.map(
              (image) => (

                <div
                  key={image.id}
                  className="relative aspect-square overflow-hidden rounded-xl"
                >

                  <Image
                    src={image.image}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />

                </div>

              )
            )}

          </div>

        </section>

      )}

      {/* Related Projects */}

      {relatedProjects.length > 0 && (

        <section>

          <h2 className="mb-6 text-3xl font-bold">
            Related Projects
          </h2>

          <div className="grid gap-8 md:grid-cols-3">

            {relatedProjects.map(
              (related) => (

                <Link
                  key={related.id}
                  href={`/projects/${related.slug}`}
                  className="overflow-hidden rounded-xl border bg-white shadow transition hover:shadow-lg"
                >

                  <div className="relative h-56">

                    <Image
                      src={related.coverImage}
                      alt={related.title}
                      fill
                      className="object-cover"
                    />

                  </div>

                  <div className="p-5">

                    <h3 className="text-xl font-semibold">
                      {related.title}
                    </h3>

                    <p className="mt-2 text-slate-500">
                      {related.location}
                    </p>

                  </div>

                </Link>

              )
            )}

          </div>

        </section>

      )}

    </main>
  );
}