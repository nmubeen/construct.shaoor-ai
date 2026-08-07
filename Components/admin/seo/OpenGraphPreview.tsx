import Card from "@/components/admin/primitives/Card";

interface OpenGraphPreviewProps {
  image: string;
  title: string;
  description: string;
  siteName: string;
}

export default function OpenGraphPreview({
  image,
  title,
  description,
  siteName,
}: OpenGraphPreviewProps) {
  return (
    <Card>
      <div className="border-b border-slate-200 px-6 py-4">
        <h3 className="text-base font-semibold text-slate-900">Open Graph Preview</h3>
      </div>

      <div className="p-5">
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="flex h-40 items-center justify-center bg-slate-100 text-sm text-slate-500">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt="Open Graph preview"
                className="h-full w-full object-cover"
              />
            ) : (
              "No image selected"
            )}
          </div>

          <div className="space-y-2 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{siteName || "Website"}</p>

            <h4 className="line-clamp-2 text-sm font-semibold text-slate-900">
              {title || "Open Graph title"}
            </h4>

            <p className="line-clamp-3 text-sm text-slate-600">
              {description || "Open Graph description preview."}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
