import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  Eye,
  FolderKanban,
  ImageIcon,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  Search,
  Settings,
  Users,
} from "lucide-react";

import { getConstructPrisma } from "@/lib/construct-prisma";

export const metadata: Metadata = {
  title: "Read-only CMS Demo | Shaoor Construct",
  robots: { index: false, follow: false },
};

const navigation = [
  ["Dashboard", "/demo/cms", LayoutDashboard],
  ["Website", "/demo/cms/website", Settings],
  ["Services", "/demo/cms/services", BriefcaseBusiness],
  ["Projects", "/demo/cms/projects", FolderKanban],
  ["Media", "/demo/cms/media", ImageIcon],
  ["Content", "/demo/cms/content", Search],
  ["Team", "/demo/cms/team", Users],
  ["Enquiries", "/demo/cms/enquiries", Mail],
  ["SEO", "/demo/cms/seo", BarChart3],
  ["Settings", "/demo/cms/settings", Settings],
] as const;

export default async function DemoCmsPage() {
  const organization = await getConstructPrisma().organization.findUnique({
    where: { slug: "demo" },
    select: {
      name: true,
      publication: { select: { status: true } },
      _count: {
        select: {
          projects: true,
          services: true,
          media: true,
          teamMembers: true,
          messages: true,
        },
      },
    },
  });
  const counts = organization?._count ?? {
    projects: 0,
    services: 0,
    media: 0,
    teamMembers: 0,
    messages: 0,
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="sticky top-0 z-30 flex items-center justify-center gap-2 bg-amber-300 px-4 py-2 text-center text-xs font-bold text-amber-950">
        <LockKeyhole className="size-4" />
        Demo mode — This CMS presentation is read-only and cannot change website
        data.
      </div>
      <div className="grid min-h-[calc(100vh-32px)] lg:grid-cols-[280px_1fr]">
        <aside className="hidden bg-slate-950 p-5 text-white lg:block">
          <Link
            href="/demo"
            className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Demo options
          </Link>
          <div className="mb-7">
            <p className="text-lg font-bold">Shaoor Construct</p>
            <p className="mt-1 text-xs uppercase tracking-[.16em] text-teal-300">
              {organization?.name ?? "Demo workspace"}
            </p>
          </div>
          <nav className="space-y-1">
            {navigation.map(([label, href, Icon], index) => (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${index === 0 ? "bg-teal-400/15 text-teal-200" : "text-slate-400"}`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="p-5 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-teal-700">
                  Read-only CMS overview
                </p>
                <h1 className="mt-2 text-3xl font-black">
                  {organization?.name ?? "Demo Construction Company"}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  See how a Construct workspace is organized before starting
                  your trial.
                </p>
              </div>
              <a
                href="https://demo.construct.shaoor-ai.com"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#0E4A7B] px-4 py-2.5 text-sm font-bold text-white"
              >
                <Eye className="size-4" />
                View public website
              </a>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                ["Projects", counts.projects],
                ["Services", counts.services],
                ["Media", counts.media],
                ["Team", counts.teamMembers],
                ["Enquiries", counts.messages],
              ].map(([label, value]) => (
                <article
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-xs font-bold uppercase tracking-[.15em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-3 text-3xl font-black">{value}</p>
                </article>
              ))}
            </div>
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">
                  Website status
                </p>
                <h2 className="mt-3 text-xl font-bold">Publication controls</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Current Demo state:{" "}
                  <strong>
                    {organization?.publication?.status ?? "DRAFT"}
                  </strong>
                  . Owners normally publish, unpublish or return a website to
                  draft here.
                </p>
                <div className="mt-5 flex gap-2">
                  <button
                    disabled
                    className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white opacity-45"
                  >
                    Publish
                  </button>
                  <button
                    disabled
                    className="rounded-lg border px-3 py-2 text-sm font-semibold opacity-45"
                  >
                    Return to draft
                  </button>
                </div>
              </article>
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">
                  Protected preview
                </p>
                <h2 className="mt-3 text-xl font-bold">Complete module tour</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Explore every CMS module from the sidebar. All controls are
                  disabled, no mutation actions are exposed, and enquiry
                  personal data is always masked.
                </p>
                <Link
                  href="/account/login?next=/account/onboarding"
                  className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"
                >
                  Start your workspace
                </Link>
              </article>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
