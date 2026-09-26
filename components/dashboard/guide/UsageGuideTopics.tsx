"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

type UsageTopic = { key: string; title: string; href: string; linkLabel: string; summary: string; points: string[] };

// Static reference content, not derived from live workspace data — unlike
// SetupGuideSteps (a one-time onboarding checklist that completes and
// stays done), these are recurring day-to-day workflows with nothing to
// "complete." Kept as a plain data array rather than a service function
// for exactly that reason: there's no DB state to compute here.
const TOPICS: UsageTopic[] = [
  {
    key: "media",
    title: "Media",
    href: "/dashboard/media",
    linkLabel: "Open Media",
    summary: "Your public media library — images and documents used across the website.",
    points: [
      "Upload from the Media page, then reuse the same file across Projects, Services, Team profiles and more.",
      "Organise files into folders as the library grows.",
      "This library is public — anything here can end up visible on your website. Project Progress photos are separate and private (see below); they're uploaded directly from a progress update, not from this library.",
      "Your plan limits how many media items you can store — check current usage on Settings.",
    ],
  },
  {
    key: "team",
    title: "Team invites",
    href: "/dashboard/team",
    linkLabel: "Open Team",
    summary: "Invite colleagues and control what they can do in this workspace.",
    points: [
      "Invite by email and assign a role: Owner and Admin manage the whole workspace and billing; Editors can create and edit day-to-day content, enquiries, proposals and progress updates; Viewers get read-only dashboard access.",
      "A pending invitation can be resent or withdrawn before it's accepted.",
      "Removing a member doesn't delete their past work — anything they created or were assigned (e.g. a follow-up) stays, just without them attached to it going forward.",
      "Your plan limits how many team seats you can have.",
    ],
  },
  {
    key: "enquiries",
    title: "Enquiries",
    href: "/dashboard/messages",
    linkLabel: "Open Enquiries",
    summary: "Messages submitted through your website's contact and service enquiry forms.",
    points: [
      "New enquiries arrive automatically — no setup needed beyond having a published site.",
      "Move each one through New → Read → Replied → Archived as you work it.",
      "Reply by email directly from the enquiry — the customer's own answers are quoted into the message body for you.",
      "From an eligible enquiry, select \"Prepare proposal\" or schedule a follow-up reminder without leaving the page.",
    ],
  },
  {
    key: "proposals",
    title: "Proposals",
    href: "/dashboard/proposals",
    linkLabel: "Open Proposals",
    summary: "Personalised, branded proposals prepared from an enquiry and shared with the customer via a private link.",
    points: [
      "Start one from an enquiry's \"Prepare proposal\" action — it drafts a requirements summary and suggests relevant portfolio projects for you.",
      "Edit the content, pricing and portfolio/testimonials freely — a draft is never visible to the customer.",
      "An Owner or Admin selects \"Approve & publish\" to make the link live. Editing again and republishing creates a new, dated revision on the same link.",
      "Track opens and any \"Discuss\" or \"Request a site visit\" response the customer sends.",
      "Included on Growth and Enterprise plans.",
    ],
  },
  {
    key: "followups",
    title: "Follow-ups",
    href: "/dashboard/followups",
    linkLabel: "Open Follow-ups",
    summary: "Internal reminders so nothing about an enquiry or proposal falls through the cracks.",
    points: [
      "Schedule a reminder directly from an enquiry or a proposal — quick date shortcuts (Tomorrow, In 3 days, Next week) or an exact date and time.",
      "The Follow-ups dashboard shows what's overdue and due today across every enquiry and proposal, with quick complete, reschedule or cancel actions.",
      "\"Complete and schedule next\" closes one out and lines up the next step in a single action.",
      "These are in-app reminders only — nothing is ever emailed, texted or sent to a customer automatically.",
      "Follow-ups on enquiries are always available; scheduling new ones on a proposal follows the Proposals plan requirement.",
    ],
  },
  {
    key: "progress",
    title: "Project Progress",
    href: "/dashboard/progress",
    linkLabel: "Open Project Progress",
    summary: "A private page for a customer to follow their project's stage, milestones and photos — never published to your public website.",
    points: [
      "Create a private project, optionally linked to the enquiry, proposal or portfolio project it came from.",
      "Add milestones and post dated updates with photos, straight from your phone on site.",
      "Editing the summary or milestones only changes your own draft — an Owner or Admin selects \"Publish changes\" before the customer sees anything different. Individual updates are published or withdrawn on their own.",
      "Generate the customer's private link from the project's workspace — the full link is shown once, so copy it immediately. Rotate it to replace a lost or mis-sent link, or revoke it to cut off access entirely.",
      "Photos are stored privately and served only through a temporary link, never a permanent public address.",
      "Included on Growth and Enterprise plans.",
    ],
  },
  {
    key: "plans",
    title: "Plans",
    href: "/dashboard/settings",
    linkLabel: "Open Settings",
    summary: "Your subscription, usage and what each plan includes.",
    points: [
      "Settings shows your current plan, subscription status, and usage against your plan's limits (projects, team seats, media items).",
      "Proposals, follow-ups on proposals, Project Progress pages and a custom domain are all Growth/Enterprise features — Free and Starter workspaces can still use enquiries, follow-ups on enquiries, and everything else.",
      "A trial runs on the plan you're trialing, so trial workspaces get that plan's full feature set for the trial period.",
      "Billing is handled by Razorpay — Shaoor-AI Construct never stores your card details directly.",
    ],
  },
  {
    key: "content-updates",
    title: "Keeping content and the site up to date",
    href: "/dashboard/content",
    linkLabel: "Open Content",
    summary: "Setup isn't a one-time job — add to it as your business grows.",
    points: [
      "Add new completed projects, testimonials and team members as they happen, not just during initial setup.",
      "Content changes go live immediately once your site is published — \"Publish\" on Settings only controls whether the site is reachable at all, not a separate draft/live copy of your content.",
      "Revisit the Setup guide checklist above any time — it always reflects your workspace's current state.",
    ],
  },
];

export function UsageGuideTopics() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {TOPICS.map((topic) => {
        const isOpen = openKey === topic.key;
        return (
          <section key={topic.key} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <button type="button" onClick={() => setOpenKey(isOpen ? null : topic.key)} className="flex w-full items-center justify-between gap-4 p-4 text-left" aria-expanded={isOpen}>
              <div>
                <h2 className="font-bold text-(--color-primary-text)">{topic.title}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{topic.summary}</p>
              </div>
              <ChevronDown className={`size-5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="border-t border-slate-100 px-4 pb-4">
                <ul className="mt-3 space-y-2">
                  {topic.points.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-slate-300" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link href={topic.href} className="mt-3 inline-block text-xs font-semibold text-(--color-secondary-text-icon) hover:underline">{topic.linkLabel} &rarr;</Link>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
