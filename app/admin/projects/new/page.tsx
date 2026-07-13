"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import PageTitle from "@/components/admin/PageTitle";
import PrimaryButton from "@/components/admin/PrimaryButton";

import TextInput from "@/components/admin/forms/TextInput";
import Select from "@/components/admin/forms/Select";
import TextArea from "@/components/admin/forms/TextArea";
import Checkbox from "@/components/admin/forms/Checkbox";
import { createProject } from "@/lib/actions/project.actions";
import {
  projectSchema,
  ProjectFormInput,
} from "@/lib/validations/project";

export default function NewProjectPage() {
  const {
    register,
    
    formState: { errors },
  } = useForm<ProjectFormInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      featured: false,
    },
  });



  return (
    <>
      <PageTitle title="Add New Project" />

      <form
        action={createProject}
        className="space-y-8 rounded-xl border bg-white p-8 shadow-sm"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Project Title"
            name="title"
            register={register}
            error={errors.title}
          />

          <TextInput
            label="Slug"
            name="slug"
            register={register}
            error={errors.slug}
          />

          <Select
            label="Category"
            name="category"
            register={register}
            options={[
              "Residential",
              "Commercial",
              "Hospitality",
              "Industrial",
              "Interior",
            ]}
            error={errors.category}
          />

          <Select
            label="Status"
            name="status"
            register={register}
            options={[
              "Completed",
              "Ongoing",
            ]}
            error={errors.status}
          />

          <TextInput
            label="Client"
            name="client"
            register={register}
            error={errors.client}
          />

          <TextInput
            label="Location"
            name="location"
            register={register}
            error={errors.location}
          />

          <TextInput
            label="Year"
            name="year"
            type="number"
            register={register}
            error={errors.year}
          />

          <TextInput
            label="Duration"
            name="duration"
            register={register}
            error={errors.duration}
          />

          <TextInput
            label="Budget"
            name="budget"
            register={register}
            error={errors.budget}
          />

          <TextInput
            label="Area"
            name="area"
            register={register}
            error={errors.area}
          />
        </div>

        <TextArea
          label="Description"
          name="description"
          register={register}
          error={errors.description}
        />

        <Checkbox
          label="Featured Project"
          name="featured"
          register={register}
        />

        <div className="pt-4">
          <PrimaryButton type="submit">
            Save Project
          </PrimaryButton>
        </div>
      </form>
    </>
  );
}