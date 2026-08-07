"use client";

import Link from "next/link";
import {
  FaHouse,
  FaFolderOpen,
  FaEnvelope,
  FaGear,
  FaMagnifyingGlass,
  FaArrowRightFromBracket,
  FaBriefcase,
  FaUsers,
  FaBuilding,
  FaQuoteLeft,
  FaCircleQuestion,
  FaImages,
  FaClipboardList,
} from "react-icons/fa6";

import { logoutAction } from "@/lib/actions/auth.actions";

interface AdminSidebarProps {
  companyName: string;
}

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
    title: "Services",
    href: "/admin/services",
    icon: <FaBriefcase />,
  },
  {
    title: "Clients",
    href: "/admin/clients",
    icon: <FaBuilding />,
  },
  {
    title: "Team",
    href: "/admin/team",
    icon: <FaUsers />,
  },
  {
    title: "Testimonials",
    href: "/admin/testimonials",
    icon: <FaQuoteLeft />,
  },
  {
    title: "FAQ",
    href: "/admin/faq",
    icon: <FaCircleQuestion />,
  },
  {
    title: "Messages",
    href: "/admin/messages",
    icon: <FaEnvelope />,
  },
  {
    title: "SEO",
    href: "/admin/seo",
    icon: <FaMagnifyingGlass />,
  },
  {
    title: "Media Library",
    href: "/admin/media",
    icon: <FaImages />,
  },
  {
    title: "Gallery",
    href: "/admin/gallery",
    icon: <FaImages />,
  },
  {
    title: "Audit Log",
    href: "/admin/audit",
    icon: <FaClipboardList />,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: <FaGear />,
  },
  
];

export default function AdminSidebar({
  companyName,
}: AdminSidebarProps) {
  return (
    <aside className="flex min-h-screen w-44 flex-col bg-slate-900 text-white">
      <div className="p-8">
        <h2 className="text-2xl font-bold">{companyName} CMS</h2>
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