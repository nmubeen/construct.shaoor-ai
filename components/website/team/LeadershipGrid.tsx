import type { PublicTeamMember } from "@/lib/public-site-data";

import LeadershipCard from "./LeadershipCard";

interface LeadershipGridProps {
  members: PublicTeamMember[];
}

export default function LeadershipGrid({
  members,
}: LeadershipGridProps) {
  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-4">
      {members.map((member) => (
        <LeadershipCard key={member.id} member={member} />
      ))}
    </div>
  );
}
