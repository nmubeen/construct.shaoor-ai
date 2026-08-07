import type { TeamMember } from "@prisma/client";

import LeadershipCard from "./LeadershipCard";

interface LeadershipGridProps {
  members: TeamMember[];
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
