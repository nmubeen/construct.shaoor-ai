import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

import ProjectForm from "@/components/admin/forms/ProjectForm";
import GalleryUploader from "@/components/admin/projects/GalleryUploader";
import GalleryGrid from "@/components/admin/projects/GalleryGrid";
import HighlightsEditor from "@/components/admin/projects/HighlightsEditor";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProjectPage({
  params,
}: PageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: {
      id: Number(id),
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

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-8">

      {/* Header */}

      <div>
        <h1 className="text-3xl font-bold">
          Edit Project
        </h1>

        <p className="mt-2 text-slate-500">
          Update the project information, cover image, gallery and highlights.
        </p>
      </div>

      {/* Main Project Form */}

      <ProjectForm
        mode="edit"
        project={project}
      />

      {/* Gallery */}

      <section className="rounded-xl border bg-white p-8 shadow">

        <div className="mb-6 flex items-center justify-between">

          <div>
            <h2 className="text-2xl font-semibold">
              Project Gallery
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Upload and manage gallery images for this project.
            </p>
          </div>

          <GalleryUploader
            projectId={project.id}
          />

        </div>

        <GalleryGrid
          images={project.gallery}
        />

      </section>

      {/* Highlights */}

      <HighlightsEditor
        projectId={project.id}
        highlights={project.highlights}
      />

    </div>
  );
}