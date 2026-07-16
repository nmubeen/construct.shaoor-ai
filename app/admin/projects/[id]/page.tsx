import Image from "next/image";
import { notFound } from "next/navigation";
import { FaCircleCheck, FaTriangleExclamation } from "react-icons/fa6";
import { prisma } from "@/lib/prisma";
import ProjectForm from "@/components/admin/projects/ProjectForm";
import GalleryUploader from "@/components/admin/projects/GalleryUploader";
import GalleryGrid from "@/components/admin/projects/GalleryGrid";
import HighlightsEditor from "@/components/admin/projects/HighlightsEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id: Number(id) },
    include: {
      gallery: { orderBy: { id: "asc" } },
      highlights: { orderBy: { id: "asc" } },
    },
  });

  if (!project) notFound();

  const galleryContainsCover = project.gallery.some(
    (img) => img.image === project.coverImage
  );
  const galleryHasImages = project.gallery.length > 0;
  const currentCover =
    project.coverImage &&
    project.coverImage !== "/images/projects/default.jpg"
      ? project.coverImage
      : project.gallery[0]?.image ?? "/images/projects/default.jpg";

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-8">
      <div>
        <h1 className="text-3xl font-bold">Edit Project</h1>
        <p className="mt-2 text-slate-500">
          Update the project information, cover image, gallery and highlights.
        </p>
      </div>

      <ProjectForm mode="edit" project={project} />

      <section className="rounded-xl border bg-white p-8 shadow">
        <h2 className="text-2xl font-semibold">Current Cover Image</h2>
        <p className="mt-2 text-slate-500">
          This image is displayed on the homepage, project listing and project
          details page.
        </p>
        <div className="relative mt-6 aspect-video max-w-4xl overflow-hidden rounded-xl border">
          <Image
            src={currentCover}
            alt={project.title}
            fill
            className="object-cover"
          />
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6 shadow">
        <h2 className="text-xl font-semibold">Gallery Health</h2>
        <div className="mt-5">
          {!galleryHasImages ? (
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <FaTriangleExclamation className="text-slate-500" />
              <div>
                <p className="font-semibold">No gallery images uploaded.</p>
                <p className="text-sm text-slate-500">
                  Upload images to automatically create the project cover image.
                </p>
              </div>
            </div>
          ) : galleryContainsCover ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <FaCircleCheck className="text-green-600" />
              <div>
                <p className="font-semibold text-green-700">
                  Gallery is healthy.
                </p>
                <p className="text-sm text-green-600">
                  A valid gallery image is currently being used as the cover
                  image.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <FaTriangleExclamation className="text-amber-600" />
              <div>
                <p className="font-semibold text-amber-700">
                  Cover image mismatch detected.
                </p>
                <p className="text-sm text-amber-600">
                  The next gallery synchronization will automatically repair the
                  cover image.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-8 shadow">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Gallery</h2>
        </div>
        <GalleryUploader projectId={project.id} />
        <div className="mt-8">
          {galleryHasImages ? (
            <GalleryGrid
              projectId={project.id}
              coverImage={project.coverImage}
              images={project.gallery.map((img) => ({
                id: img.id,
                image: img.image,
              }))}
            />
          ) : (
            <div className="rounded-lg border-2 border-dashed border-slate-300 py-12 text-center">
              <p className="text-slate-500">
                No gallery images yet. Upload images to get started.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-8 shadow">
        <h2 className="text-2xl font-bold">Project Highlights</h2>
        <p className="mt-2 text-slate-500">
          Add key points about what makes this project special.
        </p>
        <div className="mt-6">
          <HighlightsEditor
            projectId={project.id}
            highlights={project.highlights}
          />
        </div>
      </section>
    </div>
  );
}
