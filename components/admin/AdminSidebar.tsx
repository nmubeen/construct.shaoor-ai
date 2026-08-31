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
  prefix: string;
  superAdmin: boolean;
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
  prefix,
  superAdmin,
}: AdminSidebarProps) {
  const visibleMenu = superAdmin ? [{ title: "Companies", href: "/admin/companies", icon: <FaBuilding /> }] : menu;
  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col bg-[#094136] text-white shadow-[12px_0_35px_rgba(9,65,54,.12)]">
      <div className="border-b border-white/10 px-5 py-7">
        <div className="mb-3 h-1 w-12 rounded-full bg-[#7D9D76]" />
        <h2 className="text-xl font-bold leading-tight">{companyName} CMS</h2>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {visibleMenu.map((item) => (
          <Link
            key={item.href}
            href={`${prefix}${item.href}`}
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-[#7D9D76]/25 hover:text-white"
          >
            {item.icon}
            <span>{item.title}</span>
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-3 font-medium text-white transition-colors hover:bg-white/10"
          >
            <FaArrowRightFromBracket />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
