"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaTrash, FaStar } from "react-icons/fa6";
import ConfirmDialog from "@/components/admin/feedback/ConfirmDialog";

import {
  deleteProjectGalleryImage,
  setProjectCoverImage,
} from "@/lib/actions/project-gallery.actions";
import { notify } from "@/lib/toast";
import { Entity, Messages } from "@/lib/messages";

interface GalleryImage {
  id: number;
  image: string;
}

interface Props {
  projectId: number;
  coverImage: string | null;
  images: GalleryImage[];
}

export default function GalleryGrid({
  projectId,
  coverImage,
  images,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  function requestDelete(id: number) {
    setSelectedImageId(id);
    setOpen(true);
  }

  async function confirmDelete() {
    if (selectedImageId === null) return;

    try {
      setLoading(true);

      await deleteProjectGalleryImage(selectedImageId);

      router.refresh();
      notify.success(Messages.deleted(Entity.galleryImage));

      setOpen(false);
      setSelectedImageId(null);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : Messages.deleteFailed);
    } finally {
      setLoading(false);
    }
  }

async function makeCover(imagePath: string) {
  try {
    await setProjectCoverImage(projectId, imagePath);
    router.refresh();
    notify.success(Messages.updated(Entity.project));
  } catch (error) {
    notify.error(error instanceof Error ? error.message : Messages.unexpected);
  }
}

  if (images.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-slate-500">
        No gallery images uploaded yet.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-4">

      {images.map((image) => {

        const isCover =
          image.image === coverImage;

        return (

          <div
            key={image.id}
            className="overflow-hidden rounded-xl border bg-white shadow-sm"
          >

            <div className="relative aspect-square">

              <Image
                src={image.image}
                alt="Gallery Image"
                fill
                className="object-cover"
              />

            </div>

            <div className="space-y-3 p-3">

              {isCover ? (

                <div className="flex items-center justify-center rounded-lg bg-green-100 py-2 font-semibold text-green-700">

                  ★ Cover Image

                </div>

              ) : (

                <button
                  type="button"
                  onClick={() =>
                    makeCover(image.image)
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-100 py-2 font-medium text-amber-700 transition hover:bg-amber-200"
                >
                  <FaStar />

                  Set as Cover

                </button>

              )}

              <button
                type="button"
                onClick={() =>
                  requestDelete(image.id)
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-100 py-2 font-medium text-red-700 transition hover:bg-red-200"
              >
                <FaTrash />

                Delete

              </button>

            </div>

          </div>

        );

      })}

      <ConfirmDialog
        open={open}
        loading={loading}
        title="Delete Image"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => {
          if (loading) return;

          setOpen(false);
          setSelectedImageId(null);
        }}
        onConfirm={confirmDelete}
      />

    </div>
  );
}
