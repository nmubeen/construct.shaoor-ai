import AdminPage from "@/components/admin/layout/AdminPage";
import ProjectForm from "@/components/admin/projects/ProjectForm";

export default function NewProjectPage() {
  return (
    <AdminPage
      title="New Project"
      description="Create a new project for your portfolio."
    >
      <ProjectForm mode="create" />
    </AdminPage>
  );
}