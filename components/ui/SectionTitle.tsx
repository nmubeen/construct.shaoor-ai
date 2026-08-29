import SectionHeader from "@/components/website/shared/SectionHeader";

interface Props {
  title: string;
  subtitle?: string;
}

export default function SectionTitle({
  title,
  subtitle,
}: Props) {
  return <SectionHeader title={title} eyebrow={subtitle} />;
}