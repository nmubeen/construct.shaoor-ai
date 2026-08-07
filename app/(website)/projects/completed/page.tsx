import type { Metadata } from "next";

import Container from "@/components/ui/Container";
import PageBanner from "@/components/shared/PageBanner";
import ProjectCard from "@/components/website/projects/ProjectCard";
import { projects } from "@/lib/data/projects";
import { getRouteMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata({
    routePath: "/projects/completed",
    title: "Completed Projects",
    description: "Browse our portfolio of completed construction projects.",
  });
}


export default function CompletedProjectsPage() {
  const completedProjects = projects.filter(
    (project) => project.status === "Completed"
  );

  return (
    <>
      <PageBanner
        title="Completed Projects"
        subtitle="Our Portfolio"
      />

      <section className="py-24">
        <Container>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {completedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
              />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
