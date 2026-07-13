import Hero from "@/components/home/Hero";
import StudioPreview from "@/components/home/StudioPreview";
import ServicesPreview from "@/components/home/ServicesPreview";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import CTA from "@/components/home/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StudioPreview />
      <ServicesPreview />
      <FeaturedProjects />
      <WhyChooseUs />
      <CTA />
    </>
  );
}