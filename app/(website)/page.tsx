import type { Metadata } from "next";

import Hero from "@/components/website/home/Hero";
import FeaturedProjects from "@/components/website/home/FeaturedProjects";
import WhyChooseUs from "@/components/website/home/WhyChooseUs";
import Stats from "@/components/website/home/Stats";
import AboutPreview from "@/components/website/home/AboutPreview";
import CTA from "@/components/website/home/CTA";
import ServicesPreview from "@/components/website/home/ServicesPreview";
import ClientShowcase from "@/components/website/home/ClientShowcase";
import TestimonialsSection from "@/components/website/home/TestimonialsSection";
import LeadershipSection from "@/components/website/team/LeadershipSection";
import { getPublicClients, getPublicSiteSettings, getPublicTeamMembers, getPublicTestimonials } from "@/lib/public-site-data";
import { getSeoPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getSeoPageMetadata({
    pageKey: "home",
    routePath: "/",
  });
}

export default async function HomePage() {

  const [members, settings, clients, testimonials] = await Promise.all([
    getPublicTeamMembers(), getPublicSiteSettings(), getPublicClients({ featured: true, take: 8 }), getPublicTestimonials({ featured: true, take: 3 }),
  ]);
  return (
    <>
      <Hero settings={settings} />
      <AboutPreview />
      <ServicesPreview />
      <FeaturedProjects />
      <LeadershipSection
        title="Meet Our Leadership"
        subtitle=""
        members={members
          .filter((member) => member.showOnHomepage)
          .slice(0, 4)}
        buttonText="View Full Team"
        buttonHref="/team"
      />
      <Stats />
      <ClientShowcase clients={clients} />
      <TestimonialsSection testimonials={testimonials} />
      <WhyChooseUs />
      <CTA settings={settings} />
    </>
  );
}
