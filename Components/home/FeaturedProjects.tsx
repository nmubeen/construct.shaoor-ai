import Image from "next/image";
import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";
import Button from "@/components/ui/Button";

const featuredProjects = [
  {
    id: 1,
    title: "Luxury Villa",
    category: "Residential",
    location: "Hyderabad",
    coverImage: "/images/projects/project1.jpg",
  },
  {
    id: 2,
    title: "Corporate Office",
    category: "Commercial",
    location: "Hyderabad",
    coverImage: "/images/projects/project2.jpg",
  },
  {
    id: 3,
    title: "Premium Apartment",
    category: "Residential",
    location: "Hyderabad",
    coverImage: "/images/projects/project3.jpg",
  },
];

export default function FeaturedProjects() {
  return (
    <section className="bg-white py-24">
      <Container>

        <SectionTitle
          subtitle="Portfolio"
          title="Featured Projects"
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          {featuredProjects.map((project) => (

            <div
              key={project.id}
              className="overflow-hidden rounded-2xl bg-white shadow transition hover:-translate-y-2 hover:shadow-xl"
            >

              <div className="relative h-64">

                <Image
                  src={project.coverImage}
                  alt={project.title}
                  fill
                  className="object-cover"
                />

              </div>

              <div className="p-6">

                <p className="text-sm uppercase tracking-wide text-[#0E4A7B]">
                  {project.category}
                </p>

                <h3 className="mt-2 text-2xl font-semibold">
                  {project.title}
                </h3>

                <p className="mt-3 text-slate-600">
                  {project.location}
                </p>

              </div>

            </div>

          ))}

        </div>

        <div className="mt-14 text-center">

          <Button href="/projects/completed">
            View All Projects
          </Button>

        </div>

      </Container>
    </section>
  );
}