import Link from "next/link";
import {
  FaCheckCircle,
} from "react-icons/fa";

import PageSection from "@/components/website/shared/PageSection";
import SectionHeader from "@/components/website/shared/SectionHeader";
import { websiteDesign } from "@/components/website/shared/design";
import { getPublicSiteSettings } from "@/lib/public-site-data";

export default async function AboutPreview() {
  const settings = await getPublicSiteSettings();

  return (
    <PageSection
      className="bg-white"
      contentClassName="grid items-center gap-16 lg:grid-cols-2"
    >

        {/* Left */}

        <div>
          <SectionHeader
            title="Building Strong Foundations for the Future"
            eyebrow="About Us"
            align="left"
          />

          <p className="leading-8 text-slate-600">
            {settings.companyName} has earned a reputation for delivering
            high-quality residential, commercial, industrial and
            infrastructure projects through technical excellence,
            disciplined execution and long-term client relationships.
          </p>

          <div className="mt-8 space-y-4">

            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-green-600" />

              <span>
                Experienced multidisciplinary team
              </span>
            </div>

            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-green-600" />

              <span>
                Quality-driven construction practices
              </span>
            </div>

            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-green-600" />

              <span>
                Safety-first project execution
              </span>
            </div>

            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-green-600" />

              <span>
                On-time project delivery
              </span>
            </div>

          </div>

          <Link
            href="/about"
            className={`mt-10 ${websiteDesign.primaryButton} text-white!`}
          >
            Learn More
          </Link>

        </div>
    </PageSection>
  );
}
