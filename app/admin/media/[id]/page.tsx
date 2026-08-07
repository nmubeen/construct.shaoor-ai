import { notFound } from "next/navigation";

import { getMediaById } from "@/lib/actions/media.actions";

import AdminPage from "@/components/admin/layout/AdminPage";
import MediaMetadataForm from "@/components/admin/media/MediaMetadataForm";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MediaDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = Number(id);

  if (Number.isNaN(numericId) || numericId < 1) {
    notFound();
  }

  const item = await getMediaById(numericId);

  if (!item) {
    notFound();
  }

  return (
    <AdminPage
      title="Edit Media"
      description="Manage metadata, organization, and file details."
    >
      <MediaMetadataForm item={item} />
    </AdminPage>
  );
}
