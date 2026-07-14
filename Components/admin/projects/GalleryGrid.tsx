"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaTrash } from "react-icons/fa6";

interface GalleryImage {
  id: number;
  image: string;
}

interface Props {
  images: GalleryImage[];
}

export default function GalleryGrid({
  images,
}: Props) {
  const router = useRouter();

  async function deleteImage(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this image?"
    );

    if (!confirmed) return;

    const response = await fetch(
      `/api/gallery/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      alert("Failed to delete image.");
      return;
    }

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
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {images.map((image) => (
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

          <div className="flex justify-end p-3">
            <button
              type="button"
              onClick={() => deleteImage(image.id)}
              className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
              title="Delete Image"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}