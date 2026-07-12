import {
  FaAward,
  FaUsers,
  FaClock,
  FaBuilding,
} from "react-icons/fa6";

import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";

const features = [
  {
    icon: <FaAward className="text-4xl text-[#0E4A7B]" />,
    title: "Quality First",
    description:
      "We deliver every project with uncompromising quality and attention to detail.",
  },
  {
    icon: <FaClock className="text-4xl text-[#0E4A7B]" />,
    title: "On-Time Delivery",
    description:
      "Careful planning and execution ensure projects are completed on schedule.",
  },
  {
    icon: <FaUsers className="text-4xl text-[#0E4A7B]" />,
    title: "Client-Centric",
    description:
      "We collaborate closely with every client from concept to completion.",
  },
  {
    icon: <FaBuilding className="text-4xl text-[#0E4A7B]" />,
    title: "End-to-End Solutions",
    description:
      "Architecture, construction and interiors—all under one roof.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-slate-50 py-24">
      <Container>

        <SectionTitle
          subtitle="Why Choose Us"
          title="Why SAM Constructions"
        />

        <div className="grid gap-8 md:grid-cols-2">

          {features.map((feature) => (

            <div
              key={feature.title}
              className="flex gap-6 rounded-2xl bg-white p-8 shadow-sm transition hover:shadow-lg"
            >

              <div>{feature.icon}</div>

              <div>

                <h3 className="mb-3 text-2xl font-semibold">
                  {feature.title}
                </h3>

                <p className="leading-7 text-slate-600">
                  {feature.description}
                </p>

              </div>

            </div>

          ))}

        </div>

      </Container>
    </section>
  );
}