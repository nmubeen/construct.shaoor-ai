import { notFound } from "next/navigation";

import { getGallery } from "@/lib/actions/gallery.actions";

import AdminPage from "@/components/admin/layout/AdminPage";
import GalleryForm from "@/components/admin/gallery/GalleryForm";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditGalleryPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = Number(id);

  if (Number.isNaN(numericId) || numericId < 1) {
    notFound();
  }

  const gallery = await getGallery(numericId);

  if (!gallery) {
    notFound();
  }

  return (
    <AdminPage title="Edit Gallery" description="Update gallery details, images, and order.">
      <GalleryForm mode="edit" gallery={gallery} />
    </AdminPage>
  );
}
