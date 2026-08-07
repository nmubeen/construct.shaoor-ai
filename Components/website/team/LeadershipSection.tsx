import Link from "next/link";
import type { TeamMember } from "@prisma/client";

import LeadershipGrid from "./LeadershipGrid";
import { websiteDesign } from "@/components/website/shared/design";

interface LeadershipSectionProps {
  title: string;
  subtitle?: string;
  members: TeamMember[];
  buttonText?: string;
  buttonHref?: string;
}

export default function LeadershipSection({
  title,
  subtitle,
  members,
  buttonText,
  buttonHref,
}: LeadershipSectionProps) {
  const showButton = Boolean(buttonText && buttonHref);

  return (
    <section className="bg-slate-50 py-20">
      <div className={websiteDesign.container}>
        <div className="mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-4 text-lg text-slate-600">
                {subtitle}
              </p>
            )}

            {showButton && (
              <Link
                href={buttonHref!}
                className={websiteDesign.primaryButton + " mt-6 inline-flex px-5 py-3 text-sm text-white!"}
              >
                {buttonText}
              </Link>
            )}
          </div>
        </div>

        <LeadershipGrid members={members} />
      </div>
    </section>
  );
}
