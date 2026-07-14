"use client";

import { createProject } from "@/lib/actions/project.actions";
import type { ProjectWithRelations } from "@/types/project";

interface ProjectFormProps {
  mode: "create" | "edit";
  project?: ProjectWithRelations;
}



export default function ProjectForm({
  mode,
  project,
}: ProjectFormProps) {
  return (
    <form
      action={createProject}
      className="space-y-8 rounded-xl bg-white p-8 shadow"
    >
      <div className="grid gap-6 md:grid-cols-2">

        <div>
          <label className="mb-2 block font-medium">
            Project Title
          </label>

          <input
            name="title"
            defaultValue={project?.title ?? ""}
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
            defaultValue={project?.slug ?? ""}
            className="w-full rounded-lg border p-3"
            required
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Category
          </label>

          <input
            name="category"
            defaultValue={project?.category ?? ""}
            className="w-full rounded-lg border p-3"
            required
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Status
          </label>

          <select
            name="status"
            defaultValue={project?.status ?? "Completed"}
            className="w-full rounded-lg border p-3"
          >
            <option>Completed</option>
            <option>Ongoing</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Client
          </label>

          <input
            name="client"
            defaultValue={project?.client ?? ""}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Location
          </label>

          <input
            name="location"
            defaultValue={project?.location ?? ""}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Year
          </label>

          <input
            type="number"
            name="year"
            defaultValue={project?.year ?? ""}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Duration
          </label>

          <input
            name="duration"
            defaultValue={project?.duration ?? ""}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Budget
          </label>

          <input
            name="budget"
            defaultValue={project?.budget ?? ""}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Area
          </label>

          <input
            name="area"
            defaultValue={project?.area ?? ""}
            className="w-full rounded-lg border p-3"
          />
        </div>

      </div>

      <div>
        <label className="mb-2 block font-medium">
          Description
        </label>

        <textarea
          name="description"
          rows={6}
          defaultValue={project?.description ?? ""}
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div className="flex items-center gap-3">

        <input
          type="checkbox"
          name="featured"
          defaultChecked={project?.featured}
        />

        <span>Featured Project</span>

      </div>

      <button
        type="submit"
        className="rounded-lg bg-[#0E4A7B] px-8 py-3 text-white hover:bg-[#0A365A]"
      >
        {mode === "create"
          ? "Create Project"
          : "Update Project"}
      </button>

    </form>
  );
}