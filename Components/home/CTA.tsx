import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function CTA() {
  return (
    <section className="bg-[#0E4A7B] py-24">
      <Container>

        <div className="mx-auto max-w-4xl text-center">

          <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">
            Let's Build Something Extraordinary Together
          </h2>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-8 text-slate-200">
            Whether you're planning your dream home, a commercial
            development, or an interior transformation, our team is
            ready to bring your vision to life.
          </p>

          <div className="flex flex-wrap justify-center gap-5">

            <Button href="/contact">
              Contact Us
            </Button>

            <Button
              href="/projects/completed"
              variant="outline"
            >
              View Our Projects
            </Button>

          </div>

        </div>

      </Container>
    </section>
  );
}