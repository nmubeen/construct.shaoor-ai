import Link from "next/link";

export default function QuickActions() {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">

      <h2 className="mb-6 text-xl font-bold">
        Quick Actions
      </h2>

      <div className="space-y-3">

        <Link
          href="/admin/projects/new"
          className="block rounded-lg bg-[#0E4A7B] px-4 py-3 text-center font-semibold text-white hover:bg-[#0B3A61]"
        >
          + New Project
        </Link>

        <Link
          href="/admin/projects"
          className="block rounded-lg border px-4 py-3 text-center"
        >
          View Projects
        </Link>

        <Link
          href="/admin/messages"
          className="block rounded-lg border px-4 py-3 text-center"
        >
          Messages
        </Link>

      </div>

    </div>
  );
}