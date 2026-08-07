import type { Metadata } from "next";

import { getRouteMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata({
    routePath: "/projects/ongoing",
    title: "Ongoing Projects",
    description: "See our ongoing construction projects currently in progress.",
  });
}

export default function OngoingProjectsPage() {
  return <div className="container py-20">Ongoing Projects</div>;
}
