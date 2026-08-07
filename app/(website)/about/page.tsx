import type { Metadata } from "next";

import PageBanner from "@/components/shared/PageBanner";
import Container from "@/components/ui/Container";
import { websiteDesign } from "@/components/website/shared/design";
import { getSeoPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
    return getSeoPageMetadata({
        pageKey: "about",
        routePath: "/about",
    });
}

export default async function AboutPage() {
    const settings = await getSiteSettings();

    return (
        <>
            <PageBanner
                title="Our Studio"
                subtitle={`About ${settings.companyName}`}
            />

            <section className={websiteDesign.sectionY}>
                <Container>

                    <h2 className="mb-8 text-4xl font-bold">
                        Designing Spaces That Inspire
                    </h2>

                    <p className="max-w-4xl text-lg leading-9 text-slate-600">

                        At {settings.companyName} we combine architecture,
                        construction and interior design to create
                        exceptional spaces that reflect our clients&#39;
                        aspirations while maintaining functionality,
                        quality and timeless aesthetics.

                    </p>

                </Container>
            </section>
        </>
    );
}
