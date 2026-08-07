import AdminPage from "@/components/admin/layout/AdminPage";

export default function LoadingServicePage() {
  return (
    <AdminPage
      title="Edit Service"
      description="Loading service details..."
    >
      <div className="rounded-xl bg-white p-6 shadow sm:p-8">
        <p className="text-slate-500">Loading...</p>
      </div>
    </AdminPage>
  );
}
