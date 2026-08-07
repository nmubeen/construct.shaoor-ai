import type { Metadata } from "next";

import PageBanner from "@/components/shared/PageBanner";
import ProcessTimeline from "@/components/website/process/ProcessTimeLine";
import CTA from "@/components/website/home/CTA";
import { getRouteMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata({
    routePath: "/process",
    title: "Our Process",
    description: "From vision to reality, discover our end-to-end construction process.",
  });
}

export default async function ProcessPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <PageBanner
        title="Our Process"
        subtitle="From Vision to Reality"
      />

      <ProcessTimeline />

      <CTA settings={settings} />
    </>
  );
}
