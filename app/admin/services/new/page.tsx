import ServiceForm from "@/components/admin/services/ServiceForm";

export default function NewServicePage() {
  return (
    <div className="mx-auto max-w-5xl p-8">
      <h1 className="mb-8 text-3xl font-bold">
        Add New Service
      </h1>

      <ServiceForm mode="create" />
    </div>
  );
}