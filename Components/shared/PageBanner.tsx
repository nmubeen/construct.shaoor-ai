import PageHero from "@/components/website/shared/PageHero";

interface PageBannerProps {
  title: string;
  subtitle: string;
}

export default function PageBanner({
  title,
  subtitle,
}: PageBannerProps) {
  return <PageHero title={title} subtitle={subtitle} />;
}