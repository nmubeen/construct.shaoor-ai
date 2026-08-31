import { BookOpen, Building2, FolderKanban, Gauge, ImageIcon, LayoutTemplate, LogOut, Mail, Search, Settings, Users, Wrench } from "lucide-react";
import Link from "next/link";

import { constructSignOutAction } from "@/lib/actions/construct-auth.actions";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: Gauge, available: true },
  { href: "/dashboard/site", label: "Website", icon: LayoutTemplate, available: true },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban, available: true },
  { href: "/dashboard/services", label: "Services", icon: Wrench, available: true },
  { href: "/dashboard/media", label: "Media", icon: ImageIcon, available: true },
  { href: "/dashboard/content", label: "Content", icon: BookOpen, available: true },
  { href: "/dashboard/team", label: "Team", icon: Users, available: true },
  { href: "/dashboard/messages", label: "Enquiries", icon: Mail, available: true },
  { href: "/dashboard/seo", label: "SEO", icon: Search, available: true },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, available: true },
] as const;

export function ConstructDashboardSidebar({ organizationName, role, organizationStatus }: { organizationName: string; role: string; organizationStatus: string }) {
  return (
    <aside className="flex w-full flex-col border-b border-white/10 bg-[#094136] text-white shadow-[12px_0_35px_rgba(9,65,54,.14)] lg:fixed lg:inset-y-0 lg:w-72 lg:border-r">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <span className="grid size-11 place-items-center rounded-2xl bg-[#7D9D76] text-lg font-black shadow-lg shadow-black/10">S</span>
        <div className="min-w-0"><p className="font-bold">Shaoor Construct</p><p className="truncate text-xs text-white/65">{organizationName}</p></div>
      </div>
      <nav className="grid grid-cols-2 gap-1 p-3 sm:grid-cols-4 lg:flex lg:flex-1 lg:flex-col">
        {navigation.map(({ href, label, icon: Icon, available }) => available ? (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/80 transition hover:bg-[#7D9D76]/30 hover:text-white"><Icon className="size-4" />{label}</Link>
        ) : (
          <span key={href} title="Being migrated to PostgreSQL" className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500"><Icon className="size-4" />{label}</span>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/8 p-3"><Building2 className="size-4 text-[#b9cdb5]" /><div><p className="text-xs font-semibold">{role}</p><p className="text-xs text-white/55">{organizationStatus.toLowerCase()} workspace</p></div></div>
        <form action={constructSignOutAction}><button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white"><LogOut className="size-4" />Sign out</button></form>
      </div>
    </aside>
  );
}
