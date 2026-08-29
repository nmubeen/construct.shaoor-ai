"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Service } from "@prisma/client";

import {
  createService,
  updateService,
} from "@/lib/actions/service.actions";

import FormActions from "@/components/admin/common/FormActions";
import ImageUpload from "@/components/admin/common/ImageUpload";
import AdminSection from "@/components/admin/layout/AdminSection";
import NumberField from "@/components/admin/fields/NumberField";
import SwitchField from "@/components/admin/fields/SwitchField";
import TextField from "@/components/admin/fields/TextField";
import TextAreaField from "@/components/admin/fields/TextAreaField";
import { notify } from "@/lib/toast";
import { Entity, Messages } from "@/lib/messages";

interface ServiceFormProps {
  mode: "create" | "edit";
  service?: Service;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function ServiceForm({
  mode,
  service,
}: ServiceFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(
    service?.title ?? ""
  );

  const [slug, setSlug] = useState(
    service?.slug ?? ""
  );

  const action =
    mode === "create"
      ? createService
      : updateService.bind(
          null,
          service!.id
        );

  async function handleSubmit(formData: FormData) {
    try {
      await action(formData);
      notify.success(mode === "create" ? Messages.created(Entity.service) : Messages.updated(Entity.service));
      router.push("/admin/services");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : Messages.unexpected);
    }
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-8 rounded-xl bg-white p-6 shadow sm:p-8"
    >
      <AdminSection
        title="Basic Information"
        description="Public information displayed on the website."
      >
        <div className="space-y-6">
          <ImageUpload
            label="Service Image"
            name="image"
            defaultValue={service?.image ?? ""}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              label="Title"
              name="title"
              placeholder="Design and Build"
              value={title}
              onChange={(event) => {
                const nextTitle = event.target.value;
                setTitle(nextTitle);

                if (mode === "create") {
                  setSlug(slugify(nextTitle));
                }
              }}
              required
            />

            <TextField
              label="Slug"
              name="slug"
              value={slug}
              helperText="Automatically generated from the title."
              onChange={(event) => setSlug(event.target.value)}
              required
            />
          </div>

          <TextAreaField
            name="shortDescription"
            label="Short Description"
            rows={4}
            defaultValue={service?.shortDescription ?? ""}
          />

          <TextAreaField
            name="description"
            label="Description"
            rows={8}
            defaultValue={service?.description ?? ""}
          />

          <TextField
            label="Icon"
            name="icon"
            placeholder="fa-building"
            defaultValue={service?.icon ?? ""}
          />
        </div>
      </AdminSection>

      <AdminSection
        title="Display Settings"
        description="Control visibility and ordering."
      >
        <div className="space-y-6">
          <NumberField
            label="Display Order"
            name="displayOrder"
            min="0"
            helperText="Lower numbers appear first."
            defaultValue={service?.displayOrder ?? 0}
          />

          <div className="space-y-4">
            <SwitchField
              name="isActive"
              label="Status"
              text="Active"
              defaultChecked={service?.isActive ?? true}
            />
          </div>
        </div>
      </AdminSection>

      <AdminSection
        title="SEO Settings"
        description="Optional metadata for search engines."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextField
            label="SEO Title"
            name="seoTitle"
            defaultValue={service?.seoTitle ?? ""}
          />

          <TextField
            label="SEO Keywords"
            name="seoKeywords"
            defaultValue={service?.seoKeywords ?? ""}
          />

          <div className="md:col-span-2">
            <TextAreaField
              label="SEO Description"
              name="seoDescription"
              rows={3}
              defaultValue={service?.seoDescription ?? ""}
            />
          </div>

          <div className="md:col-span-2">
            <TextField
              label="Canonical URL"
              type="url"
              name="canonicalUrl"
              placeholder="https://company.com/services/design"
              helperText="Optional absolute URL."
              defaultValue={service?.canonicalUrl ?? ""}
            />
          </div>
        </div>
      </AdminSection>

      <FormActions
        cancelHref="/admin/services"
        submitLabel={
          mode === "create"
            ? "Create Service"
            : "Update Service"
        }
      />

    </form>
  );
}
