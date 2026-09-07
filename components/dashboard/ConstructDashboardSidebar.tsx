import { BookOpen, Building2, FolderKanban, Gauge, ImageIcon, LayoutTemplate, LogOut, Mail, Search, Settings, Users, Wrench } from "lucide-react";
import Link from "next/link";

import { constructSignOutAction } from "@/lib/actions/construct-auth.actions";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: Gauge, available: true, sections: ["Quick stats", "CMS migration status", "Website address & preview"] },
  { href: "/dashboard/site", label: "Website", icon: LayoutTemplate, available: true, sections: ["Company identity", "Contact and address", "Homepage hero", "Call to action", "About, mission and vision", "Social profiles"] },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban, available: true, sections: ["Project list", "Create / edit project"] },
  { href: "/dashboard/services", label: "Services", icon: Wrench, available: true, sections: ["Service list", "Create / edit service", "Seed default services"] },
  { href: "/dashboard/media", label: "Media", icon: ImageIcon, available: true, sections: ["Folder tree", "Upload files", "Media grid"] },
  { href: "/dashboard/content", label: "Content", icon: BookOpen, available: true, sections: ["Leadership profiles", "Clients", "Testimonials", "Why choose us", "Project categories", "Project statuses", "FAQs"] },
  { href: "/dashboard/team", label: "Team", icon: Users, available: true, sections: ["Invite a team member", "Members", "Pending invitations"] },
  { href: "/dashboard/messages", label: "Enquiries", icon: Mail, available: true, sections: ["Message list", "Message detail"] },
  { href: "/dashboard/seo", label: "SEO", icon: Search, available: true, sections: ["Global settings", "Page metadata"] },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, available: true, sections: ["Workspace identity", "Website theme", "Publication", "Plan usage", "Billing", "Custom domains", "Recent activity"] },
] as const;

export function ConstructDashboardSidebar({ organizationName, role, organizationStatus }: { organizationName: string; role: string; organizationStatus: string }) {
  return (
    <aside className="flex w-full flex-col border-b border-white/10 bg-linear-to-b from-[#094136] to-black text-white shadow-[12px_0_35px_rgba(9,65,54,.14)] lg:fixed lg:inset-y-0 lg:w-72 lg:border-r">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <span className="grid size-11 place-items-center rounded-md bg-[#7D9D76] text-lg font-black shadow-lg shadow-black/10">S</span>
        <div className="min-w-0"><p className="font-bold">Shaoor Construct</p><p className="truncate text-xs text-[#7D9D76]">{organizationName}</p></div>
      </div>
      <nav className="grid grid-cols-2 gap-1 p-3 sm:grid-cols-4 lg:flex lg:flex-1 lg:flex-col">
        {navigation.map(({ href, label, icon: Icon, available, sections }) => available ? (
          <div key={href} className="group relative">
            <Link href={href} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/80 transition hover:bg-[#7D9D76]/30 hover:text-white"><Icon className="size-4" />{label}</Link>
            {/* Pure CSS bubble (group-hover), no client JS needed — hidden
                below lg since the sidebar isn't a fixed side rail there,
                and hover has no real meaning on touch anyway. */}
            <div className="pointer-events-none invisible absolute left-full top-0 z-50 ml-2 w-56 -translate-x-1 rounded-lg border border-slate-200 bg-white p-3 text-slate-700 opacity-0 shadow-xl transition-all duration-150 lg:group-hover:visible lg:group-hover:translate-x-0 lg:group-hover:opacity-100">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#7D9D76]">{label}</p>
              <ul className="space-y-1">
                {sections.map((section) => <li key={section} className="text-xs leading-5">{section}</li>)}
              </ul>
            </div>
          </div>
        ) : (
          <span key={href} title="Being migrated to PostgreSQL" className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-500"><Icon className="size-4" />{label}</span>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-md border border-[#7D9D76]/40 bg-white/8 p-3"><Building2 className="size-4 text-[#7D9D76]" /><div><p className="text-xs font-semibold">{role}</p><p className="text-xs text-white/55">{organizationStatus.toLowerCase()} workspace</p></div></div>
        <form action={constructSignOutAction}><button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white"><LogOut className="size-4" />Sign out</button></form>
      </div>
    </aside>
  );
}
