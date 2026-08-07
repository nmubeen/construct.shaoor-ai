import {
  FaAward,
  FaBuilding,
  FaHelmetSafety,
  FaUsers,
} from "react-icons/fa6";

import { getSiteSettings } from "@/lib/settings";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/website/shared/SectionHeader";

export default async function Stats() {
  const settings = await getSiteSettings();

  if (!settings) return null;

  const stats = [
    {
      icon: FaBuilding,
      value: settings.projectsCompleted,
      suffix: "+",
      label: "Projects Completed",
    },
    {
      icon: FaUsers,
      value: settings.clientsServed,
      suffix: "+",
      label: "Satisfied Clients",
    },
    {
      icon: FaAward,
      value: settings.yearsExperience,
      suffix: "+",
      label: "Years of Excellence",
    },
    {
      icon: FaHelmetSafety,
      value: settings.employees,
      suffix: "",
      label: "Skilled Professionals",
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
                className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition duration-300 hover:bg-white/10"
              >
                <div className="mb-6 flex text-5xl text-accent">
                  <Icon />
                </div>

                <div className="mb-2 text-5xl font-extrabold">
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