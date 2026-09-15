import Link from "next/link";
import {
  FaArrowUpRightFromSquare,
  FaClipboardList,
  FaEnvelope,
  FaFolderPlus,
} from "react-icons/fa6";

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function getToday() {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default function DashboardHeader() {
  return (
    // Standardized admin page-header band: PrimaryBackgroundColor
    // (--gradient-primary-bg), same as the tenant home page and the login
    // screens — re-pointing the variable retints all of them.
    <div className="rounded-md bg-(image:--gradient-primary-bg) p-8 text-white">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Dashboard
          </p>

          {/* Explicit text-white: .construct-admin-surface's global
              h1/h2/h3 rule (globals.css) targets <h1> directly and beats
              the inherited white from this header. */}
          <h1 className="mt-2 text-3xl font-bold text-white">
            {getGreeting()}, Admin 👋
          </h1>

          <p className="mt-2 text-slate-200">
            {getToday()}
          </p>

          <p className="mt-4 max-w-2xl text-slate-200">
            Manage projects, services, team members, client
            enquiries and website content from one central
            dashboard.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/admin/projects/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-(image:--gradient-button-bg) px-5 py-3 font-semibold text-white transition hover:brightness-110"
          >
            <FaFolderPlus />
            Project
          </Link>

          <Link
            href="/admin/services/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-(image:--gradient-button-bg) px-5 py-3 font-semibold text-white transition hover:brightness-110"
          >
            <FaClipboardList />
            Service
          </Link>

          <Link
            href="/admin/messages"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            <FaEnvelope />
            Messages
          </Link>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            <FaArrowUpRightFromSquare />
            Website
          </Link>
        </div>
      </div>
    </div>
  );
}