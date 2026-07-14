import {
  FaBuilding,
  FaHelmetSafety,
  FaClock,
  FaAward,
} from "react-icons/fa6";

const features = [
  {
    icon: FaBuilding,
    title: "Comprehensive Expertise",
    description:
      "We deliver residential, commercial, industrial, and infrastructure projects with a strong focus on quality and execution.",
  },
  {
    icon: FaHelmetSafety,
    title: "Safety First",
    description:
      "Strict safety standards and best practices are followed throughout every stage of construction.",
  },
  {
    icon: FaClock,
    title: "On-Time Delivery",
    description:
      "Our experienced project management team ensures projects are completed on schedule without compromising quality.",
  },
  {
    icon: FaAward,
    title: "Trusted Quality",
    description:
      "We are committed to delivering durable, sustainable, and high-quality construction solutions that exceed expectations.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-16 text-center">

          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-(--primary)">
            Why Choose Us
          </span>

          <h2 className="mt-3 text-4xl font-bold">
            Building with Confidence
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg text-slate-600">
            Every project is backed by professional expertise,
            disciplined execution, and a commitment to delivering
            exceptional results.
          </p>

        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">

          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-2xl bg-white p-8 shadow-sm transition hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="mb-6 inline-flex rounded-xl bg-(--primary) p-4 text-2xl text-white">
                  <Icon />
                </div>

                <h3 className="mb-4 text-xl font-bold">
                  {feature.title}
                </h3>

                <p className="leading-7 text-slate-600">
                  {feature.description}
                </p>
              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}