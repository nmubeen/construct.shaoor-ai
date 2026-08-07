import DashboardHeader from "@/components/admin/dashboard/DashboardHeader";
import DashboardStats from "@/components/admin/dashboard/DashboardStats";
import RecentMessages from "@/components/admin/dashboard/RecentMessages";
import RecentProjects from "@/components/admin/dashboard/RecentProjects";
import ActivityTimeline from "@/components/admin/dashboard/ActivityTimeline";
import SystemStatus from "@/components/admin/dashboard/SystemStatus";
import { getDashboardData } from "@/lib/actions/dashboard.actions";

export default async function DashboardPage() {
  const {
    stats,
    recentMessages,
    recentProjects,
    activityTimeline,
    systemStatus,
  } = await getDashboardData();

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div>
        <DashboardHeader />

        <div className="space-y-12 pt-8">
          <DashboardStats stats={stats} />
          <SystemStatus status={systemStatus} />
          <div className="grid gap-6 lg:grid-cols-2">
            <RecentMessages messages={recentMessages} />
            <RecentProjects projects={recentProjects} />
          </div>

          <ActivityTimeline items={activityTimeline} />

          
        </div>
      </div>
    </div>
  );
}
