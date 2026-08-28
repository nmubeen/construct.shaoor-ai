import type { Metadata } from "next";

import LeadershipSection from "@/components/website/team/LeadershipSection";
import { getPublicTeamMembers } from "@/lib/public-site-data";
import { getSeoPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getSeoPageMetadata({ pageKey: "team", routePath: "/team" });
}

export default async function TeamPage() {
  const members = await getPublicTeamMembers();
  return <LeadershipSection title="Meet Our Leadership" subtitle="The people behind our work" members={members} />;
}
