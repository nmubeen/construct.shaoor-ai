"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  createProject,
  updateProject,
} from "@/lib/actions/project.actions";

import type { ProjectWithRelations } from "@/Types/project";

import AdminSection from "@/components/admin/layout/AdminSection";

import TextField from "@/components/admin/fields/TextField";
import TextAreaField from "@/components/admin/fields/TextAreaField";
import NumberField from "@/components/admin/fields/NumberField";
import SelectField from "@/components/admin/fields/SelectField";
import SwitchField from "@/components/admin/fields/SwitchField";

import FormActions from "@/components/admin/common/FormActions";
import ImageUpload from "@/components/admin/common/ImageUpload";
import { notify } from "@/lib/toast";
import { Entity, Messages } from "@/lib/messages";

interface ProjectFormProps {
  mode: "create" | "edit";
  project?: ProjectWithRelations;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function ProjectForm({
  mode,
  project,
}: ProjectFormProps) {
  const router = useRouter();
  const action =
    mode === "create"
      ? createProject
      : updateProject.bind(null, project!.id);

  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");

  async function handleSubmit(formData: FormData) {
    try {
      await action(formData);
      notify.success(mode === "create" ? Messages.created(Entity.project) : Messages.updated(Entity.project));
      router.push("/admin/projects");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : Messages.unexpected);
    }
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-8"
    >
      {/* =======================================================
          Project Information
      ======================================================= */}

      <AdminSection
        title="Project Information"
        description="Basic information about the project."
      >
        <div className="space-y-6 py-6">

          <ImageUpload
            label="Cover Image"
            name="coverImage"
            defaultValue={project?.coverImage ?? ""}
          />

          <div className="grid gap-6 md:grid-cols-2">

            <TextField
              label="Project Title"
              name="title"
              required
              value={title}
              onChange={(e) => {
                const nextTitle = e.target.value;
                setTitle(nextTitle);

                if (!project?.slug) {
                  setSlug(slugify(nextTitle));
                }
              }}
            />

            <TextField
              label="Slug"
              name="slug"
              required
              value={slug}
              helperText="Automatically generated from the title."
              onChange={(e) => setSlug(e.target.value)}
            />

            <TextField
              label="Category"
              name="category"
              required
              defaultValue={
                project?.category ?? ""
              }
            />

            <SelectField
              label="Status"
              name="status"
              defaultValue={
                project?.status ?? "Completed"
              }
              options={[
                {
                  label: "Completed",
                  value: "Completed",
                },
                {
                  label: "Ongoing",
                  value: "Ongoing",
                },
              ]}
            />

            <div className="md:col-span-2">

              <SwitchField
                label="Featured Project"
                name="featured"
                text="Featured"
                defaultChecked={
                  project?.featured
                }
                helperText="Display this project on the homepage."
              />

            </div>

          </div>
        </div>
      </AdminSection>

      {/* =======================================================
          Project Details
      ======================================================= */}

      <AdminSection
        title="Project Details"
        description="Client and construction details."
      >
        <div className="grid gap-6 py-6 md:grid-cols-2">

          <TextField
            label="Client"
            name="client"
            defaultValue={
              project?.client ?? ""
            }
          />

          <TextField
            label="Location"
            name="location"
            defaultValue={
              project?.location ?? ""
            }
          />

          <NumberField
            label="Year"
            name="year"
            defaultValue={
              project?.year ?? undefined
            }
          />

          <TextField
            label="Duration"
            name="duration"
            defaultValue={
              project?.duration ?? ""
            }
          />

          <TextField
            label="Budget"
            name="budget"
            defaultValue={
              project?.budget ?? ""
            }
          />

          <TextField
            label="Area"
            name="area"
            defaultValue={
              project?.area ?? ""
            }
          />

        </div>
      </AdminSection>
            {/* =======================================================
          Project Description
      ======================================================= */}

      <AdminSection
        title="Project Description"
        description="Describe the project in detail."
      >
        <div className="py-6">

          <TextAreaField
            label="Description"
            name="description"
            rows={8}
            defaultValue={
              project?.description ?? ""
            }
            helperText="This content is displayed on the project details page."
          />

        </div>
      </AdminSection>

      {/* =======================================================
          SEO
      ======================================================= */}

      <AdminSection
        title="SEO"
        description="Improve search engine visibility for this project."
      >
        <div className="grid gap-6 py-6">

          <TextField
            label="SEO Title"
            name="seoTitle"
            defaultValue={
              project?.seoTitle ?? ""
            }
            helperText="Recommended length: 50–60 characters."
          />

          <TextAreaField
            label="SEO Description"
            name="seoDescription"
            rows={4}
            defaultValue={
              project?.seoDescription ?? ""
            }
            helperText="Recommended length: 150–160 characters."
          />

          <TextField
            label="SEO Keywords"
            name="seoKeywords"
            defaultValue={
              project?.seoKeywords ?? ""
            }
            helperText="Separate keywords with commas."
          />

          <TextField
            label="Canonical URL"
            name="canonicalUrl"
            type="url"
            placeholder="https://example.com/projects/project-name"
            defaultValue={
              project?.canonicalUrl ?? ""
            }
          />

        </div>
      </AdminSection>

      <FormActions
        cancelHref="/admin/projects"
        submitLabel={
          mode === "create"
            ? "Create Project"
            : "Update Project"
        }
      />

    </form>
  );
}
