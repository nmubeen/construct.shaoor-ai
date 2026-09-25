import type { Metadata } from "next";

import { ProgressContentView } from "@/components/progress/ProgressContentView";
import { recordConstructProgressView, resolveConstructProgressByToken } from "@/lib/services/construct-progress-public.service";

// A plain top-level route (like /proposals/[token]), outside the
// (website) route group: no tenant-domain resolution, no SitePublication
// gating — this works regardless of whether the organization's
// marketing website is published, and regardless of which host the
// request arrived on. Access is controlled entirely by the bearer
// token plus organization status plus the PRIVATE_PROJECT_PROGRESS
// entitlement, never by anything host- or publication-based.
//
// Never cached, never indexed — every render re-checks token validity,
// revocation, expiry, organization suspension and the entitlement live.
// Cache-Control/Referrer-Policy/X-Robots-Tag headers for this whole
// route are set in next.config.ts's headers() (more restrictive than
// the /proposals equivalent, per this feature's own spec — private
// construction photographs, not a sales pitch).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  // Deliberately generic — never the customer's name or the project
  // title, even for a valid token (no social-preview/title leak).
  return {
    title: "Project progress",
    robots: { index: false, follow: false, nocache: true },
    // No openGraph/twitter block — a shared link then falls back to the
    // bare title above rather than guessing at page content.
  };
}

function UnavailablePage({ reason }: { reason: "not-found" | "revoked" | "expired" | "unavailable" }) {
  const copy: Record<typeof reason, { title: string; body: string }> = {
    "not-found": { title: "Page not found", body: "This link doesn't match a project page we can show you. Please check the link, or contact the company directly." },
    "revoked": { title: "This link is no longer available", body: "The company has withdrawn this link. Please contact them directly for an up-to-date link." },
    "expired": { title: "This link has expired", body: "Please contact the company for a new link." },
    "unavailable": { title: "This project page is currently unavailable", body: "Please contact the company directly." },
  };
  const { title, body } = copy[reason];
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-950">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{body}</p>
      </div>
    </main>
  );
}

export default async function PublicProgressPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const resolved = await resolveConstructProgressByToken(token);
  if (!resolved.ok) return <UnavailablePage reason={resolved.reason} />;

  // Real customer traffic only — the dashboard preview never renders
  // this route, so every call here is a genuine open.
  await recordConstructProgressView(resolved.progress.projectId);

  const { snapshot, updates, milestoneCompletion } = resolved.progress;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <ProgressContentView snapshot={snapshot} updates={updates} milestoneCompletion={milestoneCompletion} />
      </div>
    </main>
  );
}
