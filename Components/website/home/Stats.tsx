import {
  FaBuilding,
  FaHelmetSafety,
  FaScrewdriverWrench,
  FaUsers,
} from "react-icons/fa6";

import { getPublicStats } from "@/lib/public-site-data";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/website/shared/SectionHeader";

export default async function Stats() {
  const [completedProjects, activeClients, activeServices, activeTeamMembers] =
    await getPublicStats();

  const stats = [
    {
      icon: FaBuilding,
      value: completedProjects,
      suffix: "",
      label: "Projects Completed",
    },
    {
      icon: FaUsers,
      value: activeClients,
      suffix: "",
      label: "Satisfied Clients",
    },
    {
      icon: FaScrewdriverWrench,
      value: activeServices,
      suffix: "",
      label: "Active Services",
    },
    {
      icon: FaHelmetSafety,
      value: activeTeamMembers,
      suffix: "",
      label: "Team Members",
    },
  ];

  return (
    <section className="bg-primary py-24 text-white">
      <Container>
        <SectionHeader
          eyebrow="Our Numbers"
          title="Building Trust Through Results"
          subtitle="Every project reflects our commitment to quality, innovation and long-term client relationships."
          align="left"
          inverse
        />

        {/* Statistics */}

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="relative rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition duration-300 hover:bg-white/10"
              >
                <div className="absolute right-6 top-6 flex text-4xl text-accent">
                  <Icon />
                </div>

                <div className="mb-2 pt-12 text-5xl font-extrabold">
                  {stat.value}
                  {stat.suffix}
                </div>

                <div className="text-base font-medium text-slate-200">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
