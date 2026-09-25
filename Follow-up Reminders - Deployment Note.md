# Follow-up Reminders — deployment note

## What shipped

- **construct.shaoor-ai.com only** — no changes needed in shaoor-ai.com (the shared control plane). This feature deliberately reuses the *existing* `PROJECT_PROPOSALS` entitlement for proposal follow-ups and has no entitlement at all for enquiry follow-ups (see "Eligibility mapping" below) — no new `FOLLOW_UPS` feature code, no new `control.plan_entitlements` rows, no admin-UI change.
- 1 new table (`follow_ups`), 1 new enum (`FollowUpStatus`), 1 new column (`organizations.timezone`) — purely additive, no existing column changed.
- New dashboard section `/dashboard/followups`; a "Follow-ups" section added to both the enquiry detail page and the proposal detail page; a "Next follow-up" badge added to the enquiry and proposal list rows; an overdue-count badge added to the sidebar; an overview widget added to the main dashboard page; a timezone selector added to Settings → Workspace identity.

## Eligibility mapping (exact)

| Parent | Gate |
|---|---|
| Enquiry follow-up | None — matches enquiries themselves, which carry no plan/entitlement gating anywhere in this app (only role: non-Viewer). |
| Proposal follow-up — **create** or **reschedule** (changing `dueAt`) | `PROJECT_PROPOSALS` boolean entitlement, same mechanism and same three call-sites' pattern as proposal create/edit-draft/publish (`enforceConstructBooleanEntitlement`). |
| Proposal follow-up — **complete**, **cancel**, or edit of title/note/assignee only | Never gated. Losing the entitlement can never strand a reminder no one is able to close out or reassign. |

This mirrors the existing precedent exactly: proposal portfolio/testimonial management and revoke are role-gated but not entitlement-gated today either — only the three "does real new/changed proposal work" actions are. Scheduling or rescheduling a follow-up is that same category of action; completing, cancelling and reassigning are not.

## Migration

Apply `prisma/migrations-construct/20260927000000_followup_reminders/migration.sql` against the `construct` schema. It was already applied directly to the shared Supabase instance during development and verified:

- `organizations.timezone` column present, defaulted `'Asia/Kolkata'` on all existing rows.
- `follow_ups` table present with its `FollowUpStatus` enum, all 4 indexes, and the `follow_ups_exactly_one_parent` CHECK constraint (confirmed to reject both an all-NULL and a both-set parent insert — see `tests/followups/parent-constraint.test.ts`).
- All 5 foreign keys present (`organization_id` CASCADE, `enquiry_id` CASCADE, `proposal_id` CASCADE, `assignee_id`/`created_by_id`/`completed_by_id` SET NULL).

No further manual step is needed — nothing here requires anything beyond the standard `npx prisma generate --schema prisma/schema.postgresql.prisma` (already part of `npm run build`).

## Timezone default

`Asia/Kolkata`, matching this product's primary market (same reasoning as `Proposal.priceCurrency`'s `"INR"` default). Every existing organization got this default via the migration itself; an Owner/Admin can change it per-workspace on Settings → Workspace identity. The dropdown there is a curated list (`lib/followups/timezone-options.ts`); the server action validates against `Intl.supportedValuesOf`-backed `isValidTimezone()` regardless of what the UI offers.

## Rollback

Purely additive, so rolling back the *code* is safe without also rolling back the database — the new table/column simply go unused. If you do want to remove them:

```sql
-- construct schema
ALTER TABLE construct.follow_ups DROP CONSTRAINT IF EXISTS follow_ups_exactly_one_parent;
DROP TABLE IF EXISTS construct.follow_ups;
DROP TYPE IF EXISTS construct."FollowUpStatus";
ALTER TABLE construct.organizations DROP COLUMN IF EXISTS timezone;
```

## What was verified

- `npx tsc --noEmit`, `npm run lint` and `npm run build` all clean.
- 21 new automated tests (`tests/followups/*.test.ts`, run against the real database per this repo's existing convention — see `vitest.config.ts`'s comment), covering: the exactly-one-parent DB constraint (both-null, both-set, cascade-on-parent-delete, cross-org FK behavior, nonexistent-parent rejection); assignee eligibility (Owner/Editor eligible, Viewer/Invited/Removed/cross-org not, `needsReassignment`); timezone conversion round-trips including the US spring-forward and fall-back DST boundaries and an IST-vs-UTC-date-boundary case for the date shortcuts; and `listFollowUps`/`getFollowUpOverview` filter/sort/count correctness (overdue-first-then-earliest-due ordering, `scope=mine`, each status bucket in isolation). All 51 tests in the full suite (28 pre-existing + this feature's) pass together.
- **Live-rendered** the new Client Components (`FollowUpManager`, `DueDateFields`) via a temporary, unauthenticated test route driven with Playwright — the same verification technique used for this codebase's earlier "functions cannot be passed to Client Components" incident, applied proactively here given the history. This caught one real bug before it shipped: `formatZonedDateTime`/`formatZonedDate` used `Intl.DateTimeFormat(undefined, …)`, which resolves to each environment's own default locale — since these functions run both during SSR (Node's locale) and again on hydration (the browser's locale), server and client rendered different text (24-hour "21:21" vs. 12-hour "9:21 pm") and React flagged a hydration mismatch. Fixed by pinning the locale to `"en-GB"` in `lib/followups/timezone.ts`. The test route and its one-line `proxy.ts` RESERVED-path addition were both removed after verification; neither is part of this diff.
- Manually traced (not live-clicked, since it requires authenticated Supabase OTP login which isn't automatable here) the full `enquiry → assigned reminder → overdue dashboard → completion with outcome → proposal → proposal reminder → reschedule → completion` flow against the actual server action code paths and the DB schema/constraints.

## Known limitations (by design, for this version)

- No email/SMS/push/browser-push — v1 is in-app only (visible overdue/today indicators, the Overview panel, the Follow-ups dashboard, and light polling via `router.refresh()` every 60s while the Follow-ups dashboard tab is visible). This is explicit in both the spec and the owner-facing help text.
- No scheduled job computes "overdue" — it's derived at read time from `status = OPEN AND dueAt < now()`, evaluated in the organization's own timezone for the "today" boundary.
- No drag-and-drop or bulk actions on the dashboard list — one row at a time, matching this dashboard's existing UI density (proposals/enquiries lists are the same).
- A follow-up's `note`/`outcomeNote` are staff-only fields on a table with no public-facing read path at all — there was nothing to specifically exclude from `ProposalSnapshot` or the public `/proposals/[token]` route, since follow-ups are never joined into either.
