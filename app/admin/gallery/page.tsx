import { FaImages } from "react-icons/fa6";

import { getGalleries } from "@/lib/actions/gallery.actions";

import AdminPage from "@/components/admin/layout/AdminPage";
import EmptyState from "@/components/admin/common/EmptyState";
import GalleryTable from "@/components/admin/gallery/GalleryTable";

export default async function GalleryPage() {
  const galleries = await getGalleries();

  return (
    <AdminPage
      title="Gallery"
      description="Manage curated image galleries from Media Library."
      action={{
        label: "New Gallery",
        href: "/admin/gallery/new",
      }}
    >
      {galleries.length === 0 ? (
        <EmptyState
          icon={<FaImages />}
          title="No Galleries Yet"
          description="Create your first gallery and add images from Media Library."
          actionLabel="New Gallery"
          actionHref="/admin/gallery/new"
        />
      ) : (
        <GalleryTable galleries={galleries} />
      )}
    </AdminPage>
  );
}
