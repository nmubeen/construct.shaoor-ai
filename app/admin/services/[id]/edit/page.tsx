import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LegacyEditServicePage({ params }: PageProps) {
  const { id } = await params;

  redirect(`/admin/services/${id}`);
}
