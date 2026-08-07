import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";
import { websiteDesign } from "@/components/website/shared/design";

const steps = [
  {
    number: "01",
    title: "Consultation",
    description:
      "We understand your vision, budget and project requirements.",
  },
  {
    number: "02",
    title: "Planning & Design",
    description:
      "Detailed architectural planning and concept development.",
  },
  {
    number: "03",
    title: "Estimation & Approval",
    description:
      "Transparent budgeting, timelines and statutory approvals.",
  },
  {
    number: "04",
    title: "Construction",
    description:
      "Execution with continuous supervision and quality control.",
  },
  {
    number: "05",
    title: "Quality Inspection",
    description:
      "Rigorous quality checks before project completion.",
  },
  {
    number: "06",
    title: "Handover",
    description:
      "Final walkthrough and successful delivery of your project.",
  },
];

export default function ProcessTimeline() {
  return (
    <section className={`${websiteDesign.sectionY} bg-white`}>
      <Container>
        <SectionTitle
          subtitle="Our Process"
          title="How We Deliver Every Project"
        />

        <div className="space-y-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`${websiteDesign.card} flex gap-6 p-6`}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0E4A7B] text-xl font-bold text-white">
                {step.number}
              </div>

              <div>
                <h3 className="text-2xl font-semibold">
                  {step.title}
                </h3>

                <p className="mt-2 text-slate-600 leading-7">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}