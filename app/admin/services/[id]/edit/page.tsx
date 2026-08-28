import { redirect } from "next/navigation";
import { tenantPath } from "@/lib/tenant";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LegacyEditServicePage({ params }: PageProps) {
  const { id } = await params;

  redirect(await tenantPath(`/admin/services/${id}`));
}
