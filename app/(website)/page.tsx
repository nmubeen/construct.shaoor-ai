import type { Metadata } from "next";

import Hero from "@/components/website/home/Hero";
import FeaturedProjects from "@/components/website/home/FeaturedProjects";
import WhyChooseUs from "@/components/website/home/WhyChooseUs";
import Stats from "@/components/website/home/Stats";
import AboutPreview from "@/components/website/home/AboutPreview";
import CTA from "@/components/website/home/CTA";
import ServicesPreview from "@/components/website/home/ServicesPreview";
import LeadershipSection from "@/components/website/team/LeadershipSection";
import { getTeamMembers } from "@/lib/actions/team.actions";
import { getSeoPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  return getSeoPageMetadata({
    pageKey: "home",
    routePath: "/",
  });
}

export default async function HomePage() {

  const members = await getTeamMembers();
  const settings = await getSiteSettings();
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
      <WhyChooseUs />
      <CTA settings={settings} />
    </>
  );
}
