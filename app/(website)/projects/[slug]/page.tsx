import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ slug: string }>;
}
export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      gallery: { orderBy: { id: "asc" } },
      highlights: { orderBy: { id: "asc" } },
    },
  });

  if (!project) notFound();

  const relatedProjects = await prisma.project.findMany({
    where: {
      category: project.category,
      id: { not: project.id },
    },
    include: {
      gallery: { orderBy: { id: "asc" }, take: 1 },
    },
    take: 3,
  });

  const heroImage =
    project.coverImage && project.coverImage !== "/images/projects/default.jpg"
      ? project.coverImage
      : project.gallery[0]?.image ?? "/images/projects/default.jpg";

  return (
    <main className="bg-white">
      <section className="bg-slate-900 py-10 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <Link href="/projects" className="text-slate-300 hover:text-white">
            ← Back to Projects
          </Link>
          <h1 className="mt-4 text-4xl font-bold">{project.title}</h1>
          <p className="mt-2 text-slate-300">
            {project.category} • {project.location}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="relative mb-12 h-75 overflow-hidden rounded-3xl md:h-112.5 lg:h-137.5">
          <Image
            src={heroImage}
            alt={project.title}
            fill
            priority
            className="object-cover"
          />
        </div>

        <div className="mb-12 grid gap-8 md:grid-cols-4">
          <div>
            <div className="text-sm text-slate-500">Client</div>
            <div className="font-semibold">{project.client}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Location</div>
            <div className="font-semibold">{project.location}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Year</div>
            <div className="font-semibold">{project.year}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Duration</div>
            <div className="font-semibold">{project.duration}</div>
          </div>
        </div>

        <section className="mb-16">
          <h2 className="mb-6 text-3xl font-bold">About this Project</h2>
          <p className="whitespace-pre-line leading-8 text-slate-700">
            {project.description}
          </p>
        </section>

        {project.highlights.length > 0 && (
          <section className="mb-16">
            <h2 className="mb-6 text-3xl font-bold">Highlights</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {project.highlights.map((h) => (
                <div key={h.id} className="rounded-xl border p-5">
                  ✓ {h.text}
                </div>
              ))}
            </div>
          </section>
        )}

        {project.gallery.length > 0 && (
          <section className="mb-16">
            <h2 className="mb-6 text-3xl font-bold">Gallery</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {project.gallery.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square overflow-hidden rounded-xl"
                >
                  <Image
                    src={img.image}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {relatedProjects.length > 0 && (
          <section>
            <h2 className="mb-6 text-3xl font-bold">Related Projects</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {relatedProjects.map((p) => (
                <Link key={p.id} href={`/projects/${p.slug}`}>
                  <div className="overflow-hidden rounded-xl border transition hover:shadow-lg">
                    <div className="relative h-48 w-full">
                      <Image
                        src={
                          p.gallery[0]?.image ??
                          "/images/projects/default.jpg"
                        }
                        alt={p.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold">{p.title}</h3>
                      <p className="text-sm text-slate-500">{p.category}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}