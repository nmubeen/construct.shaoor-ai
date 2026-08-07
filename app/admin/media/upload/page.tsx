import AdminPage from "@/components/admin/layout/AdminPage";
import MediaUpload from "@/components/admin/media/MediaUpload";

export default function MediaUploadPage() {
  return (
    <AdminPage
      title="Upload Media"
      description="Upload files to the centralized media library for reuse across your website and CMS."
    >
      <MediaUpload />
    </AdminPage>
  );
}
