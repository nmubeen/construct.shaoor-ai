import type { ReactNode } from "react";

import Container from "@/components/ui/Container";
import { websiteDesign } from "@/components/website/shared/design";

interface PageSectionProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function PageSection({
  children,
  className = "bg-white",
  contentClassName = "",
}: PageSectionProps) {
  return (
    <section className={`${className} ${websiteDesign.sectionY}`}>
      <Container className={contentClassName}>{children}</Container>
    </section>
  );
}
