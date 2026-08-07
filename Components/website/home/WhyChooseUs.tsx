import {
  FaBuilding,
  FaHelmetSafety,
  FaClock,
  FaAward,
} from "react-icons/fa6";

import PageSection from "@/components/website/shared/PageSection";
import SectionHeader from "@/components/website/shared/SectionHeader";
import { websiteDesign } from "@/components/website/shared/design";

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
    <PageSection className="bg-slate-50">
      <SectionHeader
        eyebrow="Why Choose Us"
        title="Building with Confidence"
        subtitle="Every project is backed by professional expertise, disciplined execution, and a commitment to delivering exceptional results."
        align="left"
      />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">

          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className={websiteDesign.card}
              >
                <div className="m-8 mb-0 inline-flex rounded-xl bg-primary p-4 text-2xl text-white">
                  <Icon />
                </div>

                <h3 className="mb-4 mt-6 px-8 text-xl font-bold">
                  {feature.title}
                </h3>

                <p className="px-8 pb-8 leading-7 text-slate-600">
                  {feature.description}
                </p>
              </div>
            );
          })}

        </div>
    </PageSection>
  );
}