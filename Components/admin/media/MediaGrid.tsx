"use client";

import { useMemo, useState, useTransition } from "react";
import type { Media } from "@prisma/client";
import { useRouter } from "next/navigation";

import { deleteMedia } from "@/lib/actions/media.actions";
import { Entity, Messages } from "@/lib/messages";
import { notify } from "@/lib/toast";

import ConfirmDialog from "@/components/admin/feedback/ConfirmDialog";

import MediaCard from "./MediaCard";
import MediaPreview from "./MediaPreview";

interface MediaGridProps {
  items: Media[];
  view: "grid" | "list";
}

export default function MediaGrid({ items, view }: MediaGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [previewItem, setPreviewItem] = useState<Media | null>(null);
  const [deleteItem, setDeleteItem] = useState<Media | null>(null);

  const gridClassName = useMemo(() => {
    if (view === "list") {
      return "space-y-4";
    }

    return "grid gap-6 sm:grid-cols-2 xl:grid-cols-3";
  }, [view]);

  function handleDelete(item: Media) {
    setDeleteItem(item);
  }

  function confirmDelete() {
    if (!deleteItem) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteMedia(deleteItem.id);
        notify.success(Messages.deleted(Entity.media));
        setDeleteItem(null);
        router.refresh();
      } catch (error) {
        notify.error(error instanceof Error ? error.message : Messages.deleteFailed);
      }
    });
  }

  return (
    <>
      <div className={gridClassName}>
        {items.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            view={view}
            onPreview={setPreviewItem}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(deleteItem)}
        loading={isPending}
        title="Delete Media"
        message="This will permanently delete the file and any generated thumbnail. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setDeleteItem(null)}
        onConfirm={confirmDelete}
      />

      <MediaPreview
        open={Boolean(previewItem)}
        url={previewItem?.url ?? ""}
        title={previewItem?.title || previewItem?.originalName || "Preview"}
        isImage={previewItem?.type === "IMAGE"}
        onClose={() => setPreviewItem(null)}
      />
    </>
  );
}
