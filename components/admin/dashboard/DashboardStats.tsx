import {
  FaBuilding,
  FaClipboardList,
  FaUsers,
  FaHandshake,
  FaStar,
  FaQuestionCircle,
  FaEnvelope,
  FaGlobe,
} from "react-icons/fa";

import DashboardStatCard from "./DashboardStatCard";

interface DashboardStatsProps {
  stats: {
    projects: number;
    

    services: number;
    activeServices: number;

    team: number;
    activeTeam: number;

    clients: number;
    activeClients: number;

    testimonials: number;
    activeTestimonials: number;

    faqs: number;
    activeFaqs: number;

    messages: number;
    unreadMessages: number;
  };
}

export default function DashboardStats({
  stats,
}: DashboardStatsProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardStatCard
        title="Projects"
        value={stats.projects}
        subtitle="Total Projects"
        icon={FaBuilding}
        href="/admin/projects"
      />

      <DashboardStatCard
        title="Services"
        value={stats.services}
        subtitle={`${stats.activeServices} Active`}
        icon={FaClipboardList}
        href="/admin/services"
      />

      <DashboardStatCard
        title="Team"
        value={stats.team}
        subtitle={`${stats.activeTeam} Active`}
        icon={FaUsers}
        href="/admin/team"
      />

      <DashboardStatCard
        title="Clients"
        value={stats.clients}
        subtitle={`${stats.activeClients} Active`}
        icon={FaHandshake}
        href="/admin/clients"
      />

      <DashboardStatCard
        title="Testimonials"
        value={stats.testimonials}
        subtitle={`${stats.activeTestimonials} Published`}
        icon={FaStar}
        href="/admin/testimonials"
      />

      <DashboardStatCard
        title="FAQs"
        value={stats.faqs}
        subtitle={`${stats.activeFaqs} Published`}
        icon={FaQuestionCircle}
        href="/admin/faqs"
      />

      <DashboardStatCard
        title="Messages"
        value={stats.messages}
        subtitle={`${stats.unreadMessages} New`}
        icon={FaEnvelope}
        href="/admin/messages"
        color={
          stats.unreadMessages > 0
            ? "bg-red-600"
            : "bg-[#0E4A7B]"
        }
      />

      <DashboardStatCard
        title="Website"
        value="Online"
        subtitle="System Healthy"
        icon={FaGlobe}
        color="bg-green-600"
      />
    </div>
  );
}