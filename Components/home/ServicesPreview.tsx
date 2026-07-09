import { FaBuilding, FaHelmetSafety, FaCouch } from "react-icons/fa6";
import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";
import Button from "@/components/ui/Button";


const services = [
  {
    icon: <FaBuilding className="text-5xl text-[#0E4A7B]" />,
    title: "Architecture",
    description:
      "Innovative architectural designs that combine aesthetics, functionality, and sustainability.",
  },
  {
    icon: <FaHelmetSafety className="text-5xl text-[#0E4A7B]" />,
    title: "Construction",
    description:
      "End-to-end construction management with quality workmanship and timely project delivery.",
  },
  {
    icon: <FaCouch className="text-5xl text-[#0E4A7B]" />,
    title: "Interior Design",
    description:
      "Elegant interior solutions tailored to create beautiful and practical living spaces.",
  },
];

export default function ServicesPreview() {
  return (
    <section className="bg-slate-50 py-24">
      <Container>

        <SectionTitle
          subtitle="Our Expertise"
          title="Services We Offer"
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          {services.map((service) => (

            <div
              key={service.title}
              className="rounded-2xl bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
            >

              <div className="mb-6">
                {service.icon}
              </div>

              <h3 className="mb-4 text-2xl font-semibold">
                {service.title}
              </h3>

              <p className="mb-8 leading-7 text-slate-600">
                {service.description}
              </p>

              <Button
                href="/services"
                variant="primary"
              >
                Learn More
              </Button>

            </div>

          ))}

        </div>

      </Container>
    </section>
  );
}