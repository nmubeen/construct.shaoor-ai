import type { Metadata } from "next";

import { getRouteMetadata } from "@/lib/seo";
import { getPublicProjects } from "@/lib/public-site-data";
import ProjectCard from "@/components/website/projects/ProjectCard";
import Container from "@/components/ui/Container";
import PageBanner from "@/components/shared/PageBanner";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata({
    routePath: "/projects/ongoing",
    title: "Ongoing Projects",
    description: "See our ongoing construction projects currently in progress.",
  });
}

export default async function OngoingProjectsPage() {
  const projects = await getPublicProjects({ status: "Ongoing" });
  return <><PageBanner title="Ongoing Projects" subtitle="Work in Progress"/><section className="py-24"><Container><div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{projects.map(project => <ProjectCard key={project.id} project={{ ...project, coverImage: project.coverImage || "/images/projects/default.jpg" }}/>)}</div></Container></section></>;
}
