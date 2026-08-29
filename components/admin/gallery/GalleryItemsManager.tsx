"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Media } from "@prisma/client";
import { FaGripVertical, FaImages, FaTrash } from "react-icons/fa6";

import DashboardPanel from "@/components/admin/dashboard/DashboardPanel";
import ConfirmDialog from "@/components/admin/feedback/ConfirmDialog";
import MediaPicker from "@/components/admin/media/MediaPicker";
import { addGalleryMedia, removeGalleryMedia, updateGalleryOrder } from "@/lib/actions/gallery.actions";
import { notify } from "@/lib/toast";

interface InitialGalleryItem {
  id?: number;
  mediaId: number;
  caption?: string | null;
  media: {
    id: number;
    url: string;
    thumbnailUrl: string | null;
    title: string | null;
    originalName: string;
    altText: string | null;
  };
}

interface GalleryItemState {
  id?: number;
  mediaId: number;
  caption: string;
  media: {
    id: number;
    url: string;
    thumbnailUrl: string | null;
    title: string | null;
    originalName: string;
    altText: string | null;
  };
}

interface GalleryItemsManagerProps {
  galleryId?: number;
  initialItems?: InitialGalleryItem[];
}

function mediaLabel(item: GalleryItemState) {
  return item.media.title || item.media.originalName;
}

export default function GalleryItemsManager({ galleryId, initialItems = [] }: GalleryItemsManagerProps) {
  const router = useRouter();

  const [items, setItems] = useState<GalleryItemState[]>(
    initialItems.map((item) => ({
      id: item.id,
      mediaId: item.mediaId,
      caption: item.caption ?? "",
      media: item.media,
    }))
  );

  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const totalItems = items.length;

  const canPersist = useMemo(() => Boolean(galleryId), [galleryId]);

  async function persistOrder(nextItems: GalleryItemState[]) {
    if (!galleryId) {
      return;
    }

    const payload = nextItems
      .filter((item): item is GalleryItemState & { id: number } => item.id !== undefined)
      .map((item, index) => ({
        id: item.id,
        sortOrder: index,
        caption: item.caption.trim() === "" ? null : item.caption.trim(),
      }));

    try {
      setSaving(true);
      await updateGalleryOrder(galleryId, payload);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Unable to update image order.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePick(media: Media) {
    if (media.type !== "IMAGE") {
      notify.error("Only image files can be added to galleries.");
      return;
    }

    if (items.some((item) => item.mediaId === media.id)) {
      notify.error("This image is already in the gallery.");
      return;
    }

    if (!galleryId) {
      setItems((current) => [
        ...current,
        {
          mediaId: media.id,
          caption: "",
          media: {
            id: media.id,
            url: media.url,
            thumbnailUrl: media.thumbnailUrl,
            title: media.title,
            originalName: media.originalName,
            altText: media.altText,
          },
        },
      ]);

      return;
    }

    try {
      setSaving(true);
      await addGalleryMedia(galleryId, [media.id]);
      router.refresh();
      notify.success("Image added to gallery.");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Unable to add image.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmRemove() {
    if (!deleteId) {
      return;
    }

    const target = items.find((item) => item.mediaId === deleteId);

    if (!target) {
      setDeleteId(null);
      return;
    }

    if (!galleryId || !target.id) {
      setItems((current) => current.filter((item) => item.mediaId !== deleteId));
      setDeleteId(null);
      return;
    }

    try {
      setSaving(true);
      await removeGalleryMedia(target.id);
      setDeleteId(null);
      router.refresh();
      notify.success("Image removed from gallery.");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Unable to remove image.");
    } finally {
      setSaving(false);
    }
  }

  function moveItem(fromMediaId: number, toMediaId: number) {
    if (fromMediaId === toMediaId) {
      return;
    }

    setItems((current) => {
      const fromIndex = current.findIndex((item) => item.mediaId === fromMediaId);
      const toIndex = current.findIndex((item) => item.mediaId === toMediaId);

      if (fromIndex === -1 || toIndex === -1) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);

      if (canPersist) {
        void persistOrder(next);
      }

      return next;
    });
  }

  function updateCaption(mediaId: number, caption: string) {
    setItems((current) =>
      current.map((item) =>
        item.mediaId === mediaId
          ? {
              ...item,
              caption,
            }
          : item
      )
    );
  }

  function onCaptionBlur() {
    if (canPersist) {
      void persistOrder(items);
    }
  }

  return (
    <div className="space-y-6 py-6">
      <DashboardPanel
        title="Gallery Images"
        subtitle="Use Media Library to add existing images to this gallery."
      >
        <MediaPicker
          label="Add Image"
          type="IMAGE"
          helperText={saving ? "Saving..." : "Pick an image from Media Library."}
          onPick={handlePick}
        />

        {totalItems === 0 ? (
          <div className="mt-6 rounded-xl border-2 border-dashed border-slate-300 py-10 text-center text-slate-500">
            <FaImages className="mx-auto mb-3 text-2xl text-slate-400" />
            No images selected yet.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.mediaId}
                draggable
                onDragStart={() => setDraggedId(item.mediaId)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedId) {
                    moveItem(draggedId, item.mediaId);
                  }
                  setDraggedId(null);
                }}
                onDragEnd={() => setDraggedId(null)}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="relative aspect-4/3 bg-slate-100">
                  <Image
                    src={item.media.thumbnailUrl || item.media.url}
                    alt={item.media.altText || mediaLabel(item)}
                    fill
                    className="object-cover"
                  />

                  <div className="absolute left-2 top-2 rounded-md bg-white/90 p-2 text-slate-700 shadow">
                    <FaGripVertical />
                  </div>
                </div>

                <div className="space-y-3 p-3">
                  <p className="truncate text-sm font-medium text-slate-800">{mediaLabel(item)}</p>

                  <input
                    type="text"
                    value={item.caption}
                    onChange={(event) => updateCaption(item.mediaId, event.target.value)}
                    onBlur={onCaptionBlur}
                    placeholder="Caption (optional)"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-[#0E4A7B] focus:outline-none focus:ring-2 focus:ring-[#0E4A7B]/15"
                  />

                  <button
                    type="button"
                    onClick={() => setDeleteId(item.mediaId)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 transition hover:bg-red-50"
                  >
                    <FaTrash />
                    Remove
                  </button>
                </div>

                {!galleryId && (
                  <>
                    <input type="hidden" name="mediaIds" value={item.mediaId} readOnly />
                    <input type="hidden" name="mediaCaptions" value={item.caption} readOnly />
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </DashboardPanel>

      <ConfirmDialog
        open={Boolean(deleteId)}
        loading={saving}
        title="Remove Image"
        message="This image will be removed from the gallery."
        confirmText="Remove"
        cancelText="Cancel"
        onCancel={() => {
          if (saving) {
            return;
          }

          setDeleteId(null);
        }}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
