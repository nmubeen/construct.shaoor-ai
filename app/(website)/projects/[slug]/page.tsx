import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDefaultSEO, getRouteMetadata } from "@/lib/seo";
import PageHero from "@/components/website/shared/PageHero";
import Container from "@/components/ui/Container";
import { websiteDesign } from "@/components/website/shared/design";
import JsonLd from "@/components/shared/JsonLd";
import {
  buildBreadcrumbSchema,
  buildProjectSchema,
} from "@/lib/schema";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      coverImage: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      canonicalUrl: true,
    },
  });

  if (!project) {
    return getRouteMetadata({
      routePath: `/projects/${slug}`,
      title: "Project Details",
    });
  }

  return getRouteMetadata({
    routePath: `/projects/${slug}`,
    explicitCanonicalUrl: project.canonicalUrl,
    title: project.seoTitle ?? project.title,
    description: project.seoDescription ?? project.description,
    keywords: project.seoKeywords,
    ogTitle: project.seoTitle ?? project.title,
    ogDescription: project.seoDescription ?? project.description,
    ogImage: project.coverImage,
  });
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
  const seo = await getDefaultSEO();
  const baseUrl = new URL(seo.siteUrl).origin;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildProjectSchema({
        seo,
        project: {
          slug: project.slug,
          title: project.title,
          description: project.description,
          coverImage: project.coverImage,
          seoTitle: project.seoTitle,
          seoDescription: project.seoDescription,
          canonicalUrl: project.canonicalUrl,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          gallery: project.gallery.map((item) => ({ image: item.image })),
        },
      }),
      buildBreadcrumbSchema({
        items: [
          { name: "Home", url: `${baseUrl}/` },
          { name: "Projects", url: `${baseUrl}/projects` },
          { name: project.title, url: `${baseUrl}/projects/${project.slug}` },
        ],
      }),
    ],
  };

  return (
    <main className="bg-white">
      <JsonLd data={jsonLd} />

      <PageHero
        title={project.title}
        subtitle="Project Details"
        description={`${project.category} • ${project.location}`}
        backHref="/projects"
        backLabel="← Back to Projects"
      />

      <Container className="py-12">
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
                <div key={h.id} className={`${websiteDesign.card} p-5`}>
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
                  <div className={websiteDesign.card}>
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
      </Container>
    </main>
  );
}
