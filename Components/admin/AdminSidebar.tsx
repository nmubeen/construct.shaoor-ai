"use client";

import Link from "next/link";
import {
  FaHouse,
  FaFolderOpen,
  FaEnvelope,
  FaGear,
  FaArrowRightFromBracket,
} from "react-icons/fa6";

import { logoutAction } from "@/lib/actions/auth.actions";

const menu = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: <FaHouse />,
  },
  {
    title: "Projects",
    href: "/admin/projects",
    icon: <FaFolderOpen />,
  },
  {
    title: "Messages",
    href: "/admin/messages",
    icon: <FaEnvelope />,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: <FaGear />,
  },
];

export default function AdminSidebar() {
  return (
    <aside className="flex min-h-screen w-72 flex-col bg-slate-900 text-white">
      <div className="p-8">
        <h2 className="text-2xl font-bold">SAM Constructions CMS</h2>
      </div>

      <nav className="flex-1 space-y-2 px-4">
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-slate-800"
          >
            {item.icon}
            <span>{item.title}</span>
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700"
          >
            <FaArrowRightFromBracket />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}