import type { Metadata } from "next";

import LeadershipSection from "@/components/website/team/LeadershipSection";
import { getTeamMembers } from "@/lib/actions/team.actions";
import { getSeoPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getSeoPageMetadata({
    pageKey: "team",
    routePath: "/team",
  });
}

export default async function TeamPage() {
  const members = await getTeamMembers();

  return (
    <LeadershipSection
      title="Meet Our Leadership"
      subtitle="The people behind 2Yards Studios"
      members={members.filter((member) => member.isActive)}
    />
  );
}
