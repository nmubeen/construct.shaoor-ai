import AdminPage from "@/components/admin/layout/AdminPage";
import GalleryForm from "@/components/admin/gallery/GalleryForm";

export default function NewGalleryPage() {
  return (
    <AdminPage title="New Gallery" description="Create a curated gallery from existing media.">
      <GalleryForm mode="create" />
    </AdminPage>
  );
}
