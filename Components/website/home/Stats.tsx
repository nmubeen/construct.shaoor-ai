import {
  FaBuilding,
  FaUsers,
  FaAward,
  FaHelmetSafety,
} from "react-icons/fa6";

const stats = [
  {
    icon: FaBuilding,
    value: "250+",
    label: "Projects Completed",
  },
  {
    icon: FaUsers,
    value: "100+",
    label: "Satisfied Clients",
  },
  {
    icon: FaAward,
    value: "20+",
    label: "Years of Excellence",
  },
  {
    icon: FaHelmetSafety,
    value: "500+",
    label: "Skilled Professionals",
  },
];

export default function Stats() {
  return (
    <section className="bg-(--primary) py-20 text-white">
      <div className="mx-auto max-w-7xl px-6">

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="text-center"
              >
                <div className="mb-5 flex justify-center text-5xl text-(--accent)">
                  <Icon />
                </div>

                <div className="mb-2 text-5xl font-extrabold">
                  {stat.value}
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