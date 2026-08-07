import Card from "@/components/admin/primitives/Card";

interface GooglePreviewProps {
  title: string;
  url: string;
  description: string;
}

export default function GooglePreview({
  title,
  url,
  description,
}: GooglePreviewProps) {
  return (
    <Card>
      <div className="border-b border-slate-200 px-6 py-4">
        <h3 className="text-base font-semibold text-slate-900">Google Preview</h3>
      </div>

      <div className="space-y-2 px-6 py-5">
        <p className="line-clamp-1 text-xs text-green-700">{url}</p>

        <h4 className="line-clamp-2 text-lg font-medium leading-6 text-[#1a0dab]">
          {title || "Untitled page"}
        </h4>

        <p className="line-clamp-3 text-sm leading-6 text-slate-600">
          {description || "Add a description to preview how this page appears in search results."}
        </p>
      </div>
    </Card>
  );
}
