import { prisma } from "@/lib/prisma";

import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import RecentProjects from "@/components/admin/dashboard/RecentProjects";
import QuickActions from "@/components/admin/dashboard/QuickActions";

import {
  FaFolderOpen,
  FaCircleCheck,
  FaSpinner,
  FaEnvelope,
} from "react-icons/fa6";

export default async function DashboardPage() {
  const totalProjects = await prisma.project.count();

  const completedProjects = await prisma.project.count({
    where: {
      status: "Completed",
    },
  });

  const ongoingProjects = await prisma.project.count({
    where: {
      status: "Ongoing",
    },
  });

  const totalMessages = 0;

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Projects"
          value={totalProjects}
          icon={<FaFolderOpen />}
          color="#0E4A7B"
        />

        <DashboardCard
          title="Completed"
          value={completedProjects}
          icon={<FaCircleCheck />}
          color="#16A34A"
        />

        <DashboardCard
          title="Ongoing"
          value={ongoingProjects}
          icon={<FaSpinner />}
          color="#F59E0B"
        />

        <DashboardCard
          title="Messages"
          value={totalMessages}
          icon={<FaEnvelope />}
          color="#7C3AED"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentProjects />
        </div>

        <QuickActions />
      </div>
    </div>
  );
}
