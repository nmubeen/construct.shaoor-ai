"use client";

import { useEffect, useState } from "react";

import {
  createService,
  updateService,
} from "@/lib/actions/service.actions";

import ImageUpload from "@/components/admin/common/ImageUpload";
import FormActions from "@/components/admin/common/FormActions";

interface Service {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  image: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
}

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
  const [title, setTitle] = useState(
    service?.title ?? ""
  );

  const [slug, setSlug] = useState(
    service?.slug ?? ""
  );

  useEffect(() => {
    if (mode === "create") {
      setSlug(slugify(title));
    }
  }, [title, mode]);

  const action =
    mode === "create"
      ? createService
      : updateService.bind(
          null,
          service!.id
        );

  return (
    <form
      action={action}
      className="space-y-8 rounded-xl bg-white p-8 shadow"
    >
      <div className="grid gap-6 md:grid-cols-2">

        <div>
          <label className="mb-2 block font-medium">
            Service Title
          </label>

          <input
            name="title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            className="w-full rounded-lg border p-3"
            required
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Slug
          </label>

          <input
            name="slug"
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value)
            }
            className="w-full rounded-lg border p-3"
            required
          />
        </div>

      </div>

      <div>
        <label className="mb-2 block font-medium">
          Short Description
        </label>

        <textarea
          name="shortDescription"
          rows={3}
          defaultValue={
            service?.shortDescription ??
            ""
          }
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Description
        </label>

        <textarea
          name="description"
          rows={8}
          defaultValue={
            service?.description ??
            ""
          }
          className="w-full rounded-lg border p-3"
        />
      </div>

      <ImageUpload
        label="Service Image"
        name="image"
        defaultValue={
          service?.image ?? ""
        }
      />

      <div className="grid gap-6 md:grid-cols-2">

        <div>
          <label className="mb-2 block font-medium">
            Icon
          </label>

          <input
            name="icon"
            defaultValue={
              service?.icon ?? ""
            }
            className="w-full rounded-lg border p-3"
            placeholder="fa-building"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Display Order
          </label>

          <input
            type="number"
            name="displayOrder"
            defaultValue={
              service?.displayOrder ??
              0
            }
            className="w-full rounded-lg border p-3"
          />
        </div>

      </div>

      <label className="flex items-center gap-3">

        <input
          type="checkbox"
          name="isActive"
          defaultChecked={
            service?.isActive ??
            true
          }
        />

        Active

      </label>

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