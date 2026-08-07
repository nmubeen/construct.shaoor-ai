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
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[#0E4A7B]">
            Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {getGreeting()}, Admin 👋
          </h1>

          <p className="mt-2 text-slate-600">
            {getToday()}
          </p>

          <p className="mt-4 max-w-2xl text-slate-600">
            Manage projects, services, team members, client
            enquiries and website content from one central
            dashboard.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/admin/projects/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0E4A7B] px-5 py-3 font-semibold text-white transition hover:bg-[#0B3C64]"
          >
            <FaFolderPlus />
            Project
          </Link>

          <Link
            href="/admin/services/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0E4A7B] px-5 py-3 font-semibold text-white transition hover:bg-[#0B3C64]"
          >
            <FaClipboardList />
            Service
          </Link>

          <Link
            href="/admin/messages"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <FaEnvelope />
            Messages
          </Link>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <FaArrowUpRightFromSquare />
            Website
          </Link>
        </div>
      </div>
    </div>
  );
}