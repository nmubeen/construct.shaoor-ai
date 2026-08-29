"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TeamMember } from "@prisma/client";

import {
  createTeamMember,
  updateTeamMember,
} from "@/lib/actions/team.actions";

import FormActions from "@/components/admin/common/FormActions";
import ImageUpload from "@/components/admin/common/ImageUpload";
import AdminSection from "@/components/admin/layout/AdminSection";
import NumberField from "@/components/admin/fields/NumberField";
import SwitchField from "@/components/admin/fields/SwitchField";
import TextField from "@/components/admin/fields/TextField";
import TextAreaField from "@/components/admin/fields/TextAreaField";
import { notify } from "@/lib/toast";
import { Entity, Messages } from "@/lib/messages";

interface TeamFormProps {
  mode: "create" | "edit";
  member?: TeamMember;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function TeamForm({
  mode,
  member,
}: TeamFormProps) {
  const router = useRouter();
  const [name, setName] = useState(member?.name ?? "");
  const [slug, setSlug] = useState(member?.slug ?? "");

  const action =
    mode === "create"
      ? createTeamMember
      : updateTeamMember.bind(null, member!.id);

  async function handleSubmit(formData: FormData) {
    try {
      await action(formData);
      notify.success(mode === "create" ? Messages.created(Entity.team) : Messages.updated(Entity.team));
      router.push("/admin/team");
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
            label="Photo"
            name="photo"
            defaultValue={member?.photo ?? ""}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              label="Name"
              name="name"
              placeholder="John Smith"
              autoComplete="name"
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

          <TextField
            label="Designation"
            name="designation"
            placeholder="Chief Executive Officer"
            defaultValue={member?.designation ?? ""}
            required
          />

          <TextAreaField
            name="shortBio"
            label="Short Bio"
            rows={4}
            helperText="Displayed on the Team page."
            defaultValue={member?.shortBio ?? ""}
          />
        </div>
      </AdminSection>



      <AdminSection
        title="Contact Information"
        description="Optional contact information displayed publicly."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextField
            label="Email"
            type="email"
            name="email"
            placeholder="john@example.com"
            autoComplete="email"
            defaultValue={member?.email ?? ""}
          />

          <TextField
            label="Phone"
            type="tel"
            name="phone"
            autoComplete="tel"
            defaultValue={member?.phone ?? ""}
          />
        </div>
      </AdminSection>

      <AdminSection
        title="Social Media"
        description="Links to social and professional profiles."
      >
        <div className="grid gap-6 md:grid-cols-3">
          <TextField
            label="LinkedIn"
            type="url"
            name="linkedin"
            placeholder="https://linkedin.com/in/..."
            defaultValue={member?.linkedin ?? ""}
          />

          <TextField
            label="Instagram"
            type="url"
            name="instagram"
            defaultValue={member?.instagram ?? ""}
          />

          <TextField
            label="Twitter"
            type="url"
            name="twitter"
            defaultValue={member?.twitter ?? ""}
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
            defaultValue={member?.displayOrder ?? 0}
          />

          <div className="space-y-4">
            <SwitchField
              name="showOnHomepage"
              label="Homepage"
              text="Show on Homepage"
              defaultChecked={member?.showOnHomepage ?? true}
            />

            <SwitchField
              name="isActive"
              label="Status"
              text="Active"
              defaultChecked={member?.isActive ?? true}
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
            defaultValue={member?.seoTitle ?? ""}
          />

          <TextField
            label="SEO Keywords"
            name="seoKeywords"
            defaultValue={member?.seoKeywords ?? ""}
          />

          <div className="md:col-span-2">
            <TextAreaField
              label="SEO Description"
              name="seoDescription"
              rows={3}
              defaultValue={member?.seoDescription ?? ""}
            />
          </div>

          <div className="md:col-span-2">
            <TextField
              label="Canonical URL"
              type="url"
              name="canonicalUrl"
              placeholder="https://company.com/team/john"
              helperText="Optional absolute URL."
              defaultValue={member?.canonicalUrl ?? ""}
            />
          </div>
        </div>
      </AdminSection>

      <FormActions
        cancelHref="/admin/team"
        submitLabel={
          mode === "create" ? "Create Team Member" : "Update Team Member"
        }
      />
    </form>
  );
}
