"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Media } from "@prisma/client";
import { FaImages } from "react-icons/fa6";

import MediaPicker from "@/components/admin/media/MediaPicker";
import { addProjectGalleryImage } from "@/lib/actions/project-gallery.actions";
import { notify } from "@/lib/toast";
import { Messages } from "@/lib/messages";

interface GalleryUploaderProps {
  projectId: number;
}

export default function GalleryUploader({
  projectId,
}: GalleryUploaderProps) {
  const router = useRouter();

  const [uploading, setUploading] = useState(false);

  async function handlePick(item: Media) {
    try {
      setUploading(true);

      await addProjectGalleryImage(projectId, item.url);

      router.refresh();
      notify.success(Messages.created("Gallery image"));
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Failed to add gallery image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="inline-flex items-center gap-2 rounded-lg bg-[#0E4A7B]/10 px-4 py-2 text-sm font-medium text-[#0E4A7B]">
        <FaImages />
        Add gallery images from Media Library
      </div>

      <MediaPicker
        label="Gallery Image"
        type="IMAGE"
        helperText={uploading ? "Adding selected image..." : "Select an image to append to this project gallery."}
        onPick={handlePick}
      />
    </div>
  );
}
