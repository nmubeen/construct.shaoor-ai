"use client";

import Link from "next/link";
import {
  FaHouse,
  FaFolderOpen,
  FaEnvelope,
  FaGear,
} from "react-icons/fa6";

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
    <aside className="min-h-screen w-72 bg-slate-900 text-white">
      <div className="p-8">
        <h2 className="text-2xl font-bold">2 Yards CMS</h2>
      </div>

      <nav className="space-y-2 px-4">
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-slate-800"
          >
            {item.icon}
            {item.title}
          </Link>
        ))}
      </nav>
    </aside>
  );
}