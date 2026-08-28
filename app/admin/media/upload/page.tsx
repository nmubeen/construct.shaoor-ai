import AdminPage from "@/components/admin/layout/AdminPage";
import MediaUpload from "@/components/admin/media/MediaUpload";
import { getMediaFolders } from "@/lib/actions/media.actions";

export default async function MediaUploadPage() {
  const folders = await getMediaFolders();
  return (
    <AdminPage
      title="Upload Media"
      description="Upload files to the centralized media library for reuse across your website and CMS."
    >
      <MediaUpload folders={folders} />
    </AdminPage>
  );
}
