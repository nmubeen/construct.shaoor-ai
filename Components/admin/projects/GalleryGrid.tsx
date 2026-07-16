"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaTrash, FaStar } from "react-icons/fa6";

import {
  deleteGalleryImage,
  setProjectCoverImage,
} from "@/lib/actions/gallery.actions";

interface GalleryImage {
  id: number;
  image: string;
}

interface Props {
  projectId: number;
  coverImage: string;
  images: GalleryImage[];
}

export default function GalleryGrid({
  projectId,
  coverImage,
  images,
}: Props) {
  const router = useRouter();


  async function deleteImage(id: number) {
    if (
      !window.confirm(
        "Delete this image?"
      )
    ) {
      return;
    }

    await deleteGalleryImage(id);

    router.refresh();
  }

async function makeCover(imagePath: string) {
  await setProjectCoverImage(projectId, imagePath);
  router.refresh();
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
                  deleteImage(image.id)
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

    </div>
  );
}