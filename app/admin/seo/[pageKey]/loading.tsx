import AdminPage from "@/components/admin/layout/AdminPage";

export default function LoadingSeoEditorPage() {
  return (
    <AdminPage
      title="SEO"
      description="Loading page metadata..."
    >
      <div className="rounded-xl bg-white p-6 shadow sm:p-8">
        <p className="text-slate-500">Loading...</p>
      </div>
    </AdminPage>
  );
}
