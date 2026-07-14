import Hero from "@/components/website/home/Hero";
import FeaturedProjects from "@/components/website/home/FeaturedProjects";
import WhyChooseUs from "@/components/website/home/WhyChooseUs";
import Stats from "@/components/website/home/Stats";
import AboutPreview from "@/components/website/home/AboutPreview";
import CTA from "@/components/website/home/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />

      <FeaturedProjects />

      <WhyChooseUs />

      <Stats />

      <AboutPreview />

      <CTA />
    </>
  );
}