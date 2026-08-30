import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DemoCmsHeader,
  DemoCmsShell,
  ReadOnlyButton,
} from "@/components/portal/DemoCmsShell";
import { getDemoCmsData, isDemoCmsModule } from "@/lib/demo-cms";

export const metadata: Metadata = {
  title: "CMS Module Demo",
  robots: { index: false, follow: false },
};
const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
function Empty({ label }: { label: string }) {
  return (
    <div className={`${card} border-dashed text-center text-sm text-slate-500`}>
      No {label.toLowerCase()} have been added to the Demo workspace yet.
    </div>
  );
}
function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[.12em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-800">
        {value === null || value === undefined || value === ""
          ? "Not configured"
          : String(value)}
      </dd>
    </div>
  );
}
function Page({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <DemoCmsHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      {action && (
        <div className="mb-5 flex justify-end">
          <ReadOnlyButton>{action}</ReadOnlyButton>
        </div>
      )}
      {children}
    </>
  );
}

export default async function DemoCmsModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  if (!isDemoCmsModule(module) || module === "overview") notFound();
  const organization = await getDemoCmsData();
  if (!organization) notFound();
  const settings = organization.settings;
  let content: React.ReactNode;

  if (module === "website")
    content = (
      <Page
        eyebrow="Website CMS"
        title="Website identity"
        description="Company details, homepage copy, contact information and calls to action are managed here."
        action="Save website settings"
      >
        <dl className={`${card} grid gap-5 sm:grid-cols-2 xl:grid-cols-3`}>
          <Field label="Company name" value={settings?.companyName} />
          <Field label="Tagline" value={settings?.tagline} />
          <Field label="Email" value={settings?.email} />
          <Field label="Phone" value={settings?.phone} />
          <Field label="City" value={settings?.city} />
          <Field label="Country" value={settings?.country} />
          <Field label="Hero title" value={settings?.heroTitle} />
          <Field label="Hero subtitle" value={settings?.heroSubtitle} />
          <Field label="Call to action" value={settings?.ctaTitle} />
        </dl>
      </Page>
    );
  else if (module === "projects")
    content = (
      <Page
        eyebrow="Portfolio"
        title="Projects"
        description="Manage completed and ongoing project case studies, galleries and featured homepage entries."
        action="New project"
      >
        <div className="grid gap-4">
          {organization.projects.length ? (
            organization.projects.map((project) => (
              <article key={project.id} className={card}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold">{project.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {project.category} · {project.location} · {project.year}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {project.description}
                    </p>
                  </div>
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                    {project.status}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <Empty label="projects" />
          )}
        </div>
      </Page>
    );
  else if (module === "services")
    content = (
      <Page
        eyebrow="Capabilities"
        title="Services"
        description="Control the services shown on the public website, their order and visibility."
        action="New service"
      >
        <div className="grid gap-4">
          {organization.services.length ? (
            organization.services.map((service) => (
              <article key={service.id} className={card}>
                <h2 className="font-bold">{service.title}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {service.shortDescription}
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  /{service.slug} · {service.isActive ? "Active" : "Inactive"}
                </p>
              </article>
            ))
          ) : (
            <Empty label="services" />
          )}
        </div>
      </Page>
    );
  else if (module === "media")
    content = (
      <Page
        eyebrow="Asset library"
        title="Media"
        description="Images and documents uploaded here can be reused throughout the website."
        action="Upload media"
      >
        {organization.media.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {organization.media.map((item) => (
              <article key={item.id} className={card}>
                <div className="grid aspect-video place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-400">
                  {item.type}
                </div>
                <h2 className="mt-3 truncate text-sm font-bold">
                  {item.title ?? item.originalName}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {Math.ceil(item.fileSize / 1024)} KB
                </p>
              </article>
            ))}
          </div>
        ) : (
          <Empty label="media items" />
        )}
      </Page>
    );
  else if (module === "content")
    content = (
      <Page
        eyebrow="Reusable content"
        title="Content"
        description="Client logos, testimonials, FAQs and navigation entries support the public website."
      >
        <div className="grid gap-5 xl:grid-cols-2">
          {[
            ["Clients", organization.clients.map((x) => x.name)],
            [
              "Testimonials",
              organization.testimonials.map((x) => x.clientName),
            ],
            ["FAQs", organization.faqs.map((x) => x.question)],
            ["Navigation", organization.navigationItems.map((x) => x.label)],
          ].map(([label, items]) => (
            <article key={label as string} className={card}>
              <div className="flex items-center justify-between">
                <h2 className="font-bold">{label}</h2>
                <ReadOnlyButton>Add</ReadOnlyButton>
              </div>
              <div className="mt-4 space-y-2">
                {(items as string[]).length ? (
                  (items as string[]).map((item) => (
                    <p
                      key={item}
                      className="rounded-xl bg-slate-50 px-3 py-2 text-sm"
                    >
                      {item}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No entries yet.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </Page>
    );
  else if (module === "team")
    content = (
      <Page
        eyebrow="People"
        title="Team"
        description="Manage public team profiles and their display order. Workspace access is managed separately."
        action="New team member"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {organization.teamMembers.length ? (
            organization.teamMembers.map((person) => (
              <article key={person.id} className={card}>
                <h2 className="font-bold">{person.name}</h2>
                <p className="mt-1 text-sm text-teal-700">
                  {person.designation}
                </p>
                <p className="mt-3 text-sm text-slate-600">{person.shortBio}</p>
              </article>
            ))
          ) : (
            <Empty label="team members" />
          )}
        </div>
      </Page>
    );
  else if (module === "enquiries")
    content = (
      <Page
        eyebrow="Lead inbox"
        title="Enquiries"
        description="This public Demo intentionally hides names, email addresses and message text. Customer workspaces show their own isolated submissions only."
      >
        <div className="grid gap-4">
          {organization.messages.length ? (
            organization.messages.map((message, index) => (
              <article key={message.id} className={card}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold">Demo enquiry {index + 1}</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Received {message.createdAt.toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                    {message.status}
                  </span>
                </div>
                <p className="mt-3 text-sm italic text-slate-400">
                  Personal details are protected in the public Demo.
                </p>
              </article>
            ))
          ) : (
            <Empty label="enquiries" />
          )}
        </div>
      </Page>
    );
  else if (module === "seo")
    content = (
      <Page
        eyebrow="Search visibility"
        title="SEO"
        description="Control site-wide search defaults and page-specific titles, descriptions and indexing."
        action="Save SEO settings"
      >
        <dl className={`${card} grid gap-5 sm:grid-cols-2`}>
          <Field label="Site name" value={organization.seoSettings?.siteName} />
          <Field
            label="Default title"
            value={organization.seoSettings?.defaultTitle}
          />
          <Field
            label="Description"
            value={organization.seoSettings?.defaultDescription}
          />
          <Field label="Site URL" value={organization.seoSettings?.siteUrl} />
        </dl>
        <div className="mt-5 grid gap-3">
          {organization.seoPages.map((page) => (
            <article key={page.id} className={card}>
              <h2 className="font-bold">{page.pageName}</h2>
              <p className="mt-1 text-sm text-slate-600">{page.title}</p>
            </article>
          ))}
        </div>
      </Page>
    );
  else
    content = (
      <Page
        eyebrow="Workspace administration"
        title="Settings"
        description="Owners control publication state, domains and workspace identity from this module."
      >
        <div className="grid gap-5 xl:grid-cols-2">
          <article className={card}>
            <h2 className="font-bold">Publication</h2>
            <p className="mt-2 text-sm text-slate-600">
              Current state:{" "}
              <strong>{organization.publication?.status ?? "DRAFT"}</strong>
            </p>
            <div className="mt-4">
              <ReadOnlyButton>Change publication</ReadOnlyButton>
            </div>
          </article>
          <article className={card}>
            <h2 className="font-bold">Domains</h2>
            <div className="mt-3 space-y-2">
              {organization.domains.map((domain) => (
                <div
                  key={domain.id}
                  className="rounded-xl bg-slate-50 p-3 text-sm"
                >
                  <strong>{domain.hostname}</strong>
                  <p className="mt-1 text-xs text-slate-500">
                    {domain.status}
                    {domain.isPrimary ? " · Primary" : ""}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <ReadOnlyButton>Add domain</ReadOnlyButton>
            </div>
          </article>
        </div>
      </Page>
    );

  return (
    <DemoCmsShell active={module} organizationName={organization.name}>
      <div className="mx-auto max-w-6xl">{content}</div>
    </DemoCmsShell>
  );
}
