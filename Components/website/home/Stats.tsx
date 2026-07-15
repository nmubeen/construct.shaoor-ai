import {
  FaBuilding,
  FaUsers,
  FaAward,
  FaHelmetSafety,
} from "react-icons/fa6";

import { getSiteSettings } from "@/lib/settings";

export default async function Stats() {
  const settings = await getSiteSettings();

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
      suffix: "+",
      label: "Skilled Professionals",
    },
  ];

  return (
    <section className="bg-primary py-20 text-white">
      <div className="mx-auto max-w-7xl px-6">

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="text-center"
              >
                <div className="mb-5 flex justify-center text-5xl text-accent">
                  <Icon />
                </div>

                <div className="mb-2 text-5xl font-extrabold">
                  {stat.value}
                  {stat.suffix}
                </div>

                <div className="text-lg text-slate-200">
                  {stat.label}
                </div>
              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}