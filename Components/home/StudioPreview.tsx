import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";
import Image from "next/image";
import Button from "@/components/ui/Button";

export default function StudioPreview() {
  return (
    <section className="bg-white py-24">
      <Container>

        <SectionTitle
          subtitle="Who We Are"
          title="Designing Spaces That Inspire"
        />

        <div className="grid items-center gap-16 lg:grid-cols-2">

          <div>
            <Image
              src="/images/hero/hero.jpg"
              alt="2 Yards Studios"
              width={700}
              height={500}
              className="rounded-2xl object-cover shadow-xl"
            />
          </div>

          <div>

            <p className="mb-6 text-lg leading-8 text-slate-600">
              At <strong>2 Yards Studios</strong>, we believe every
              project starts with a vision. We specialize in
              architecture, construction, and interior solutions that
              blend creativity with precision to deliver spaces that are
              functional, elegant, and built to last.
            </p>

            <p className="mb-10 text-lg leading-8 text-slate-600">
              Whether it's a residence, commercial development, or
              interior transformation, our team works closely with
              clients from concept through completion, ensuring quality,
              transparency, and timely delivery at every stage.
            </p>

            <Button href="/studio">
              Learn More
            </Button>

          </div>

        </div>

      </Container>
    </section>
  );
}