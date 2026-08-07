"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createGallery, updateGallery } from "@/lib/actions/gallery.actions";
import type { getGallery } from "@/lib/actions/gallery.actions";
import FormActions from "@/components/admin/common/FormActions";
import ImageUpload from "@/components/admin/common/ImageUpload";
import NumberField from "@/components/admin/fields/NumberField";
import SwitchField from "@/components/admin/fields/SwitchField";
import TextAreaField from "@/components/admin/fields/TextAreaField";
import TextField from "@/components/admin/fields/TextField";
import AdminSection from "@/components/admin/layout/AdminSection";
import GalleryItemsManager from "@/components/admin/gallery/GalleryItemsManager";
import { Entity, Messages } from "@/lib/messages";
import { notify } from "@/lib/toast";

interface GalleryFormProps {
  mode: "create" | "edit";
  gallery?: NonNullable<Awaited<ReturnType<typeof getGallery>>>;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function GalleryForm({ mode, gallery }: GalleryFormProps) {
  const router = useRouter();

  const action = mode === "create" ? createGallery : updateGallery.bind(null, gallery!.id);

  const [title, setTitle] = useState(gallery?.title ?? "");
  const [slug, setSlug] = useState(gallery?.slug ?? "");

  async function handleSubmit(formData: FormData) {
    if (mode === "create") {
      const mediaIds = formData
        .getAll("mediaIds")
        .map((value) => Number(String(value).trim()))
        .filter((value) => !Number.isNaN(value) && value > 0);

      if (mediaIds.length === 0) {
        notify.error("Add at least one image to the gallery.");
        return;
      }
    }

    try {
      await action(formData);
      notify.success(mode === "create" ? Messages.created(Entity.gallery) : Messages.updated(Entity.gallery));
      router.push("/admin/gallery");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : Messages.saveFailed);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-8 rounded-xl bg-white p-6 shadow sm:p-8">
      <AdminSection title="Gallery Details" description="Basic information and display settings for this gallery.">
        <div className="space-y-6 py-6">
          <ImageUpload
            label="Cover Image"
            name="coverImage"
            defaultValue={gallery?.coverImage ?? ""}
            helperText="Select an image from Media Library."
          />

          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              label="Gallery Name"
              name="title"
              required
              value={title}
              onChange={(event) => {
                const nextTitle = event.target.value;
                setTitle(nextTitle);

                if (!gallery?.slug) {
                  setSlug(slugify(nextTitle));
                }
              }}
            />

            <TextField
              label="Slug"
              name="slug"
              required
              value={slug}
              helperText="Automatically generated from the gallery name."
              onChange={(event) => setSlug(event.target.value)}
            />
          </div>

          <TextAreaField
            label="Description"
            name="description"
            rows={4}
            defaultValue={gallery?.description ?? ""}
          />

          <div className="grid gap-6 md:grid-cols-3">
            <NumberField
              label="Sort Order"
              name="sortOrder"
              min="0"
              defaultValue={gallery?.sortOrder ?? 0}
            />

            <SwitchField
              label="Featured"
              name="featured"
              text="Featured"
              defaultChecked={gallery?.featured ?? false}
            />

            <SwitchField
              label="Status"
              name="isActive"
              text="Active"
              defaultChecked={gallery?.isActive ?? true}
            />
          </div>
        </div>
      </AdminSection>

      <AdminSection
        title="Image Management"
        description="Add images from Media Library, update captions, and reorder with drag-and-drop."
      >
        <GalleryItemsManager galleryId={gallery?.id} initialItems={gallery?.items ?? []} />
      </AdminSection>

      <FormActions cancelHref="/admin/gallery" submitLabel={mode === "create" ? "Create Gallery" : "Update Gallery"} />
    </form>
  );
}
