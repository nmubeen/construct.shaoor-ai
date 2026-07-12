import Image from "next/image";
import { notFound } from "next/navigation";
import Container from "@/components/ui/Container";
import PageBanner from "@/components/shared/PageBanner";
import { projects } from "@/lib/data/projects";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      <PageBanner title={project.title} subtitle={project.category} />

      <section className="py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative h-70 overflow-hidden rounded-3xl sm:h-90 lg:h-105">
              <Image
                src={project.coverImage}
                alt={project.title}
                fill
                className="object-cover"
              />
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-900">
                  {project.category}
                </p>
                <h1 className="mt-3 text-4xl font-semibold">{project.title}</h1>
                <p className="mt-4 text-lg text-slate-600">{project.description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Client</p>
                  <p className="mt-1 font-semibold">{project.client}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Location</p>
                  <p className="mt-1 font-semibold">{project.location}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Year</p>
                  <p className="mt-1 font-semibold">{project.year}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Budget</p>
                  <p className="mt-1 font-semibold">{project.budget}</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
