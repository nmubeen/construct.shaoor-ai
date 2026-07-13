import Link from "next/link";

import PageTitle from "@/components/admin/PageTitle";
import PrimaryButton from "@/components/admin/PrimaryButton";
import EmptyState from "@/components/admin/EmptyState";

export default function ProjectsPage() {
  return (
    <>
      <PageTitle
        title="Projects"
        actions={
          <Link href="/admin/projects/new">
            <PrimaryButton>
              + New Project
            </PrimaryButton>
          </Link>
        }
      />

      <EmptyState
        title="No Projects Yet"
        description="Click 'New Project' to create your first project."
      />
    </>
  );
}