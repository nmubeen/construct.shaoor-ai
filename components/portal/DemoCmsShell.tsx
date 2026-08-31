import {
  ArrowLeft,
  BookOpen,
  Eye,
  FolderKanban,
  Gauge,
  ImageIcon,
  LayoutTemplate,
  LockKeyhole,
  Mail,
  Search,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import type { DemoCmsModule } from "@/lib/demo-cms";

const navigation = [
  ["overview", "Overview", Gauge],
  ["website", "Website", LayoutTemplate],
  ["projects", "Projects", FolderKanban],
  ["services", "Services", Wrench],
  ["media", "Media", ImageIcon],
  ["content", "Content", BookOpen],
  ["team", "Team", Users],
  ["enquiries", "Enquiries", Mail],
  ["seo", "SEO", Search],
  ["settings", "Settings", Settings],
] as const;

export function DemoCmsShell({
  active,
  organizationName,
  children,
}: {
  active: DemoCmsModule;
  organizationName: string;
  children: React.ReactNode;
}) {
  return (
    <main className="construct-app-surface construct-admin-surface min-h-screen text-slate-950">
      <div className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-amber-300 px-4 py-2 text-center text-xs font-bold text-amber-950">
        <LockKeyhole className="size-4" />
        Demo mode — every CMS module is read-only. Changes, uploads and
        submissions are disabled.
      </div>
      <div className="lg:grid lg:min-h-[calc(100vh-32px)] lg:grid-cols-[280px_1fr]">
        <aside className="border-b bg-[#094136] p-4 text-white shadow-[12px_0_35px_rgba(9,65,54,.12)] lg:sticky lg:top-8 lg:h-[calc(100vh-32px)] lg:border-b-0 lg:p-5">
          <div className="flex items-center justify-between gap-4 lg:block">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Demo options
            </Link>
            <a
              href="https://demo.construct.shaoor-ai.com"
              className="inline-flex items-center gap-2 text-sm text-[#b9cdb5] lg:mt-3"
            >
              <Eye className="size-4" />
              Website
            </a>
          </div>
          <div className="my-5 hidden lg:block">
            <p className="text-lg font-bold">Shaoor Construct</p>
            <p className="mt-1 text-xs uppercase tracking-[.16em] text-[#b9cdb5]">
              {organizationName}
            </p>
          </div>
          <nav className="mt-4 grid grid-cols-2 gap-1 sm:grid-cols-5 lg:flex lg:flex-col">
            {navigation.map(([key, label, Icon]) => (
              <Link
                key={key}
                href={key === "overview" ? "/demo/cms" : `/demo/cms/${key}`}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${active === key ? "bg-[#7D9D76]/30 text-white" : "text-white/65 hover:bg-white/8 hover:text-white"}`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="min-w-0 p-5 sm:p-8 lg:p-10">{children}</section>
      </div>
    </main>
  );
}

export function DemoCmsHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mb-7">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-[#7D9D76]">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        {description}
      </p>
    </header>
  );
}

export function ReadOnlyButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled
      title="Disabled in Demo mode"
      className="rounded-xl bg-[#094136] px-4 py-2.5 text-sm font-bold text-white opacity-45"
    >
      {children}
    </button>
  );
}
