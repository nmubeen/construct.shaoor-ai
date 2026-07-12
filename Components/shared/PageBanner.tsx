import Container from "@/components/ui/Container";

interface PageBannerProps {
  title: string;
  subtitle: string;
}

export default function PageBanner({
  title,
  subtitle,
}: PageBannerProps) {
  return (
    <section className="relative flex h-105 items-center bg-[#0E4A7B]">
      <Container>

        <p className="mb-5 uppercase tracking-[5px] text-yellow-400">
          {subtitle}
        </p>

        <h1 className="text-5xl font-bold text-white md:text-6xl">
          {title}
        </h1>

      </Container>
    </section>
  );
}