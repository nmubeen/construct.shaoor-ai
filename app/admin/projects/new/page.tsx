import ProjectForm from "@/components/admin/forms/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-5xl p-8">
      <h1 className="mb-8 text-3xl font-bold">
        Add New Project
      </h1>

      <ProjectForm mode="create" />
    </div>
  );
}