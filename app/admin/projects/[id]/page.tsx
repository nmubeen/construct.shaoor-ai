import Image from "next/image";
import { notFound } from "next/navigation";
import {
  FaCircleCheck,
  FaTriangleExclamation,
} from "react-icons/fa6";

import { prisma } from "@/lib/prisma";

import AdminPage from "@/components/admin/layout/AdminPage";
import AdminSection from "@/components/admin/layout/AdminSection";

import ProjectForm from "@/components/admin/projects/ProjectForm";
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

  const galleryContainsCover =
    project.gallery.some(
      (img) =>
        img.image === project.coverImage
    );

  const galleryHasImages =
    project.gallery.length > 0;

  const currentCover =
    project.coverImage &&
    project.coverImage !==
      "/images/projects/default.jpg"
      ? project.coverImage
      : project.gallery[0]?.image ??
        "/images/projects/default.jpg";

  return (
    <AdminPage
      title="Edit Project"
      description="Update project information, gallery and highlights."
    >
      <ProjectForm
        mode="edit"
        project={project}
      />

      <AdminSection
        title="Current Cover Image"
        description="Displayed on project listings and homepage."
      >
        <div className="py-6">
          <div className="relative aspect-video max-w-4xl overflow-hidden rounded-xl border">
            <Image
              src={currentCover}
              alt={project.title}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </AdminSection>

      <AdminSection
        title="Gallery Health"
        description="Checks whether the cover image is synchronized."
      >
        <div className="py-6">
          {!galleryHasImages ? (
            <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
              <FaTriangleExclamation className="text-slate-500" />

              <div>
                <p className="font-semibold">
                  No gallery images uploaded.
                </p>

                <p className="text-sm text-slate-500">
                  Upload images to
                  automatically create the
                  project cover image.
                </p>
              </div>
            </div>
          ) : galleryContainsCover ? (
            <div className="flex items-center gap-4 rounded-lg border border-green-200 bg-green-50 p-5">
              <FaCircleCheck className="text-green-600" />

              <div>
                <p className="font-semibold text-green-700">
                  Gallery is healthy.
                </p>

                <p className="text-sm text-green-600">
                  The cover image is in sync
                  with the gallery.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 rounded-lg border border-amber-200 bg-amber-50 p-5">
              <FaTriangleExclamation className="text-amber-600" />

              <div>
                <p className="font-semibold text-amber-700">
                  Cover image mismatch.
                </p>

                <p className="text-sm text-amber-600">
                  The next gallery sync will
                  repair the cover image.
                </p>
              </div>
            </div>
          )}
        </div>
      </AdminSection>

      <AdminSection
        title="Gallery"
        description="Upload and organize project images."
      >
        <div className="py-6 space-y-8">
          <GalleryUploader
            projectId={project.id}
          />

          {galleryHasImages ? (
            <GalleryGrid
              projectId={project.id}
              coverImage={project.coverImage}
              images={project.gallery.map(
                (img) => ({
                  id: img.id,
                  image: img.image,
                })
              )}
            />
          ) : (
            <div className="rounded-lg border-2 border-dashed border-slate-300 py-12 text-center text-slate-500">
              No gallery images yet.
            </div>
          )}
        </div>
      </AdminSection>

      <AdminSection
        title="Project Highlights"
        description="Highlight key features of this project."
      >
        <div className="py-6">
          <HighlightsEditor
            projectId={project.id}
            highlights={
              project.highlights
            }
          />
        </div>
      </AdminSection>
    </AdminPage>
  );
}