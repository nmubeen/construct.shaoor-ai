import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";

export default function Hero() {
  return (
    <section
      className="relative flex min-h-[90vh] items-center bg-cover bg-center"
      style={{
        backgroundImage: "url('/images/hero/hero.jpg')",
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-slate-900/65"></div>

      <Container className="relative z-10">

        <div className="max-w-3xl">

          <p className="mb-6 uppercase tracking-[6px] text-yellow-400">
            Architecture • Construction • Interiors
          </p>

          <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-7xl">

            DESIGN

            <br />

            <span className="text-yellow-400">
              BUILD
            </span>

            <br />

            DELIVER

          </h1>

          <p className="mb-10 max-w-xl text-lg leading-8 text-slate-200">

            We transform ideas into timeless spaces through
            thoughtful design, precise planning and
            uncompromising execution.

          </p>

          <div className="flex flex-wrap gap-4">

            <Button href="/projects/completed">
              Explore Projects
            </Button>

            <Button
              href="/contact"
              variant="outline"
            >
              Contact Us
            </Button>

          </div>

        </div>

      </Container>

    </section>
  );
}