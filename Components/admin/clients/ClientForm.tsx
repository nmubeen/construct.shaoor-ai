"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@prisma/client";

import {
  createClient,
  updateClient,
} from "@/lib/actions/client.actions";

import FormActions from "@/components/admin/common/FormActions";
import ImageUpload from "@/components/admin/common/ImageUpload";
import AdminSection from "@/components/admin/layout/AdminSection";
import NumberField from "@/components/admin/fields/NumberField";
import SwitchField from "@/components/admin/fields/SwitchField";
import TextField from "@/components/admin/fields/TextField";
import TextAreaField from "@/components/admin/fields/TextAreaField";
import { notify } from "@/lib/toast";
import { Entity, Messages } from "@/lib/messages";

interface ClientFormProps {
  mode: "create" | "edit";
  client?: Client;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function ClientForm({
  mode,
  client,
}: ClientFormProps) {
  const router = useRouter();
  const [name, setName] = useState(client?.name ?? "");
  const [slug, setSlug] = useState(client?.slug ?? "");

  const action =
    mode === "create"
      ? createClient
      : updateClient.bind(null, client!.id);

  async function handleSubmit(formData: FormData) {
    try {
      await action(formData);
      notify.success(mode === "create" ? Messages.created(Entity.client) : Messages.updated(Entity.client));
      router.push("/admin/clients");
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
            label="Logo"
            name="logo"
            defaultValue={client?.logo ?? ""}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              label="Name"
              name="name"
              placeholder="Acme Builders"
              value={name}
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);

                if (mode === "create") {
                  setSlug(slugify(nextName));
                }
              }}
              required
            />

            <TextField
              label="Slug"
              name="slug"
              value={slug}
              helperText="Automatically generated from the name."
              onChange={(event) => setSlug(event.target.value)}
              required
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              label="Website"
              type="url"
              name="website"
              placeholder="https://client.com"
              defaultValue={client?.website ?? ""}
            />

            <TextField
              label="Category"
              name="category"
              placeholder="Real Estate"
              defaultValue={client?.category ?? ""}
            />
          </div>

          <TextAreaField
            name="description"
            label="Description"
            rows={4}
            defaultValue={client?.description ?? ""}
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
            defaultValue={client?.displayOrder ?? 0}
          />

          <div className="space-y-4">
            <SwitchField
              name="featured"
              label="Featured"
              text="Show as Featured"
              defaultChecked={client?.featured ?? false}
            />

            <SwitchField
              name="active"
              label="Status"
              text="Active"
              defaultChecked={client?.active ?? true}
            />
          </div>
        </div>
      </AdminSection>

      <FormActions
        cancelHref="/admin/clients"
        submitLabel={
          mode === "create" ? "Create Client" : "Update Client"
        }
      />
    </form>
  );
}
