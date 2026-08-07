"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Media } from "@prisma/client";

import { deleteMedia, updateMedia } from "@/lib/actions/media.actions";
import { Entity, Messages } from "@/lib/messages";
import { formatFileSize } from "@/lib/media";
import { notify } from "@/lib/toast";

import ConfirmDialog from "@/components/admin/feedback/ConfirmDialog";
import FormActions from "@/components/admin/common/FormActions";
import AdminSection from "@/components/admin/layout/AdminSection";

interface MediaMetadataFormProps {
  item: Media;
}

export default function MediaMetadataForm({ item }: MediaMetadataFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  async function handleSubmit(formData: FormData) {
    try {
      await updateMedia(item.id, formData);
      notify.success(Messages.updated(Entity.media));
      router.refresh();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : Messages.saveFailed);
    }
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteMedia(item.id);
        notify.success(Messages.deleted(Entity.media));
        router.push("/admin/media");
      } catch (error) {
        notify.error(error instanceof Error ? error.message : Messages.deleteFailed);
      }
    });
  }

  const isImage = item.type === "IMAGE";

  return (
    <>
      <form action={handleSubmit} className="space-y-8 rounded-xl bg-white p-6 shadow sm:p-8">
        <AdminSection
          title="Preview"
          description="Visual preview and technical details of this media item."
        >
          <div className="space-y-6 py-6">
            <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-50">
              {isImage ? (
                <div className="relative aspect-video w-full">
                  <Image
                    src={item.url}
                    alt={item.altText || item.title || item.originalName}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center px-4 text-center text-sm font-medium text-slate-600">
                  Preview unavailable for this file type.
                </div>
              )}
            </div>

            <dl className="grid gap-4 text-sm text-slate-700 md:grid-cols-2">
              <div>
                <dt className="text-slate-500">Original Name</dt>
                <dd className="font-medium text-slate-900">{item.originalName}</dd>
              </div>

              <div>
                <dt className="text-slate-500">Stored Name</dt>
                <dd className="font-medium text-slate-900">{item.fileName}</dd>
              </div>

              <div>
                <dt className="text-slate-500">Type</dt>
                <dd className="font-medium text-slate-900">{item.type}</dd>
              </div>

              <div>
                <dt className="text-slate-500">Size</dt>
                <dd className="font-medium text-slate-900">{formatFileSize(item.fileSize)}</dd>
              </div>

              <div>
                <dt className="text-slate-500">Dimensions</dt>
                <dd className="font-medium text-slate-900">
                  {item.width && item.height ? `${item.width} x ${item.height}` : "-"}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">Extension</dt>
                <dd className="font-medium text-slate-900">.{item.extension}</dd>
              </div>
            </dl>
          </div>
        </AdminSection>

        <AdminSection
          title="Metadata"
          description="Update descriptive data used throughout the CMS."
        >
          <div className="grid gap-6 py-6 md:grid-cols-2">
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-700">
                Title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                maxLength={160}
                defaultValue={item.title ?? ""}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 focus:border-[#0E4A7B] focus:outline-none focus:ring-2 focus:ring-[#0E4A7B]/15"
              />
            </div>

            <div>
              <label htmlFor="altText" className="mb-2 block text-sm font-medium text-slate-700">
                Alt Text
              </label>

              <input
                id="altText"
                name="altText"
                type="text"
                maxLength={200}
                defaultValue={item.altText ?? ""}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 focus:border-[#0E4A7B] focus:outline-none focus:ring-2 focus:ring-[#0E4A7B]/15"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="folder" className="mb-2 block text-sm font-medium text-slate-700">
                Folder
              </label>

              <input
                id="folder"
                name="folder"
                type="text"
                maxLength={140}
                defaultValue={item.folder ?? ""}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 focus:border-[#0E4A7B] focus:outline-none focus:ring-2 focus:ring-[#0E4A7B]/15"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows={4}
                maxLength={1000}
                defaultValue={item.description ?? ""}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 focus:border-[#0E4A7B] focus:outline-none focus:ring-2 focus:ring-[#0E4A7B]/15"
              />
            </div>
          </div>
        </AdminSection>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
          >
            Delete Media
          </button>
        </div>

        <FormActions cancelHref="/admin/media" submitLabel="Save Changes" />
      </form>

      <ConfirmDialog
        open={showDeleteDialog}
        loading={isPending}
        title="Delete Media"
        message="This will permanently delete this file and its thumbnail from storage."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
