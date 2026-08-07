import { MediaType } from "@prisma/client";

interface MediaFiltersProps {
  currentType: "ALL" | MediaType;
  currentFolder: string;
  currentExtension: string;
  currentSort: "newest" | "oldest" | "name" | "size";
  folders: string[];
  extensions: string[];
}

export default function MediaFilters({
  currentType,
  currentFolder,
  currentExtension,
  currentSort,
  folders,
  extensions,
}: MediaFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="sr-only" htmlFor="media-type">Type</label>
      <select
        id="media-type"
        name="type"
        defaultValue={currentType}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#0E4A7B] focus:outline-none focus:ring-2 focus:ring-[#0E4A7B]/15"
      >
        <option value="ALL">All Types</option>
        <option value="IMAGE">Image</option>
        <option value="DOCUMENT">Document</option>
        <option value="VIDEO">Video</option>
        <option value="OTHER">Other</option>
      </select>

      <label className="sr-only" htmlFor="media-folder">Folder</label>
      <select
        id="media-folder"
        name="folder"
        defaultValue={currentFolder}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#0E4A7B] focus:outline-none focus:ring-2 focus:ring-[#0E4A7B]/15"
      >
        <option value="">All Folders</option>
        {folders.map((folder) => (
          <option key={folder} value={folder}>
            {folder}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="media-extension">Extension</label>
      <select
        id="media-extension"
        name="extension"
        defaultValue={currentExtension}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#0E4A7B] focus:outline-none focus:ring-2 focus:ring-[#0E4A7B]/15"
      >
        <option value="">All Extensions</option>
        {extensions.map((extension) => (
          <option key={extension} value={extension}>
            .{extension}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="media-sort">Sort</label>
      <select
        id="media-sort"
        name="sort"
        defaultValue={currentSort}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#0E4A7B] focus:outline-none focus:ring-2 focus:ring-[#0E4A7B]/15"
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="name">Name</option>
        <option value="size">Size</option>
      </select>
    </div>
  );
}
