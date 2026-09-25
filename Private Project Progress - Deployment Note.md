# Private Project Progress — deployment note

## What shipped

- **construct.shaoor-ai.com**: 5 new tables (`progress_projects`, `progress_milestones`, `progress_updates`, `progress_photos`, `progress_snapshots`), 3 new enums, all purely additive — no existing column touched except `.env.example`'s documentation of the Supabase secret key (see below). New top-level public route `/progress/[token]`, new dashboard section `/dashboard/progress`, a new private Supabase Storage bucket (`construct-progress-media`), and a new service-role Supabase client (`lib/supabase/service.ts`) used only for that bucket.
- **shaoor-ai.com** (shared control plane): one data-only migration seeding a new `PRIVATE_PROJECT_PROGRESS` boolean feature code into the existing `control.plan_entitlements` table — no schema or admin-UI change; `app/admin/plans/[id]`'s `PlanEntitlementsEditor` already renders/edits any feature code generically, confirmed before writing this migration.

## Eligibility mapping (exact)

`PRIVATE_PROJECT_PROGRESS` is a fully independent entitlement — never inferred from `PROJECT_PROPOSALS` or any enquiry-related eligibility (confirmed with a live query that both entitlements exist as separate rows even where their current values happen to match).

Confirmed live for `SHAOOR_CONSTRUCT` (queried directly against `control.plans`/`control.products` before writing the migration, since an earlier migration's assumption about which Enterprise plan codes exist wasn't traceable to any migration file in git history — it turned out to be correct, but was verified, not assumed):

| Plan | Value |
|---|---|
| FREE | `false` |
| STARTER_MONTHLY / STARTER_ANNUAL | `false` |
| GROWTH_MONTHLY / GROWTH_ANNUAL | `true` |
| ENTERPRISE_MONTHLY / ENTERPRISE_ANNUAL | `true` |

Within the app, entitlement enforcement splits into two groups:

| Action | Gated by entitlement? |
|---|---|
| Create project, edit project/lifecycle, add/edit/reorder milestones, create/edit a draft or published update, upload/add/reorder/remove a photo, publish changes (summary+milestones snapshot), publish an update, generate/rotate access link | **Yes** |
| Withdraw a published update, discard a never-published draft, revoke an access link | **No** — these only ever *reduce* customer-visible exposure, so they stay available even after the entitlement is lost (matches the product spec's explicit "allow ... revocation of existing links" during entitlement loss) |

Reading (dashboard list/detail/preview pages, the public customer page's own access-denial branches) is never entitlement-gated by itself — only the *mutations* above are. A trial inherits the criterion automatically: a trialing organization's `plan_code` is its real assigned plan (e.g. `GROWTH_MONTHLY`) with subscription status `TRIALING`, not a separate `TRIAL` plan code — same mechanism already relied on by `PROJECT_PROPOSALS`.

## Migration order

1. **construct.shaoor-ai.com** — apply `prisma/migrations-construct/20260928010000_private_progress_pages/migration.sql` against the `construct` schema.
2. **construct.shaoor-ai.com** — apply `prisma/provision-construct-progress-storage.sql` (creates the private `construct-progress-media` bucket; safe to re-run, uses `ON CONFLICT DO UPDATE` on the bucket row only).
3. **shaoor-ai.com** — apply `prisma/migrations/20260928000000_construct_private_progress_entitlement/migration.sql` against the `control` schema.

Both were already applied directly to the shared Supabase instance during development and verified:

- All 5 tables + the `progress_photos_exactly_one_source` CHECK constraint confirmed present and enforcing (see `tests/progress/constraints.test.ts`).
- `construct-progress-media` bucket confirmed `public = false`, 10 MB limit, JPEG/PNG/WebP/AVIF only.
- `PRIVATE_PROJECT_PROGRESS` confirmed `true` on Growth/Enterprise (both intervals), `false` on Free/Starter — see `tests/progress/entitlement-catalog.test.ts`.

**Unlike `PROJECT_PROPOSALS`'s migration**, this entitlement seed uses `ON CONFLICT (plan_id, feature_code) DO NOTHING`, not `DO UPDATE` — re-running it (or a future migration touching the same feature code) will never silently overwrite a value an administrator has since changed by hand through `PlanEntitlementsEditor`. `PROJECT_PROPOSALS`'s own migration still uses `DO UPDATE` and was left as-is (out of scope for this change) — worth revisiting separately if the same protection is wanted there.

## Storage bucket policy — read this before touching it

`construct-progress-media` deliberately has **no `storage.objects` RLS policies at all**, unlike the existing public `construct-media` bucket (which has INSERT/UPDATE/DELETE policies trusting the authenticated user's own session). Every operation on this bucket — staff upload, staff/customer signed-URL issuance, deletion — goes through `lib/supabase/service.ts`'s Supabase **service-role** client (Supabase's newer "secret key" naming, `SUPABASE_SECRET_KEY`, not the legacy `SUPABASE_SERVICE_ROLE_KEY` name still in some docs), which bypasses Storage RLS entirely. This app's own Next.js server code is the real authorizer in every case: staff mutations re-check organization membership, role and the entitlement; the public route re-checks the bearer token, revocation, expiry, organization status and the entitlement. There is no direct client-to-Supabase-Storage path for this bucket to defend, so an RLS policy here would be inert. **Do not add one without first introducing an actual direct-client access path that would need it** — see the provisioning script's own header comment.

## Configuration — new environment variable

`SUPABASE_SECRET_KEY` — already present with a real value in the local `.env` (Supabase's newer key-naming convention; the value starts `sb_secret_...`). **This must also be set in Vercel's production environment variables before this feature will work there** — I could not confirm from this environment whether it already is. If it's missing, every progress-photo upload, staff preview, and public page view will fail with "Missing SUPABASE_SECRET_KEY." `.env.example` has been corrected to reference this variable instead of the stale `SUPABASE_SERVICE_ROLE_KEY` name it previously documented (that name was never actually read by any code).

No other new environment variables. The public progress URL is built from the same `appUrl()` helper the proposal and team-invite links already use.

## Regenerating the Prisma client

```
npx prisma generate --schema prisma/schema.postgresql.prisma
```
Already part of `npm run build`. As with the proposal/follow-up features, a plain `npm install` can prune the generated `node_modules/@prisma/construct-client` directory (it's generated, not tracked in `package-lock.json`) — re-run the command above if `next dev`/`npm test` then can't find it.

## What was verified

- `npx tsc --noEmit`, targeted `eslint` on every changed/new file, `npm run build`, and the full `vitest` suite (95/95 tests passing, including 51 pre-existing tests from the follow-up/proposal features) all clean.
- **51 new automated tests** (`tests/progress/*.test.ts`, run against the real database and the real Supabase Storage project per this repo's existing convention), covering: the exactly-one-photo-source DB constraint, cascade deletes (project→milestones/updates/photos/snapshots, update→photos), SET NULL behavior on optional cross-links, cross-organization link-candidate isolation, snapshot privacy exclusions (customer email/phone/internal notes/hidden location never leak into the published snapshot, verified by string-searching the serialized JSON for planted marker values), snapshot immutability across republishing, milestone-completion counting, pending-changes diff detection (summary-only and milestone-only changes both detected), the public resolver's full set of failure branches (not-found, revoked, expired, organization-suspended, entitlement-missing — the last two verified to produce an *identical* response, so neither ever leaks which one actually happened), view-count deduplication, and the entitlement catalog's exact seeded values.
- **Live, end-to-end verification of the private storage pipeline** against the real Supabase project (not mocked): uploaded a real JPEG with embedded EXIF, confirmed the stored copy has that EXIF stripped; confirmed the bucket's "public" URL genuinely returns 400 (not the file) — the private-bucket configuration actually blocks direct access, not just in theory; confirmed a signed URL genuinely serves the correct image bytes with the correct content-type; confirmed a signed URL stops working immediately after the underlying object is deleted.
- **Live-rendered the new Client Components** (`MilestoneManager`, `ProgressAccessPanel`, `ProgressPhotoUploader`, and `ProgressContentView`/`PhotoLightbox` fed real signed photo URLs from the step above) via a temporary, unauthenticated test route driven with Playwright — the same technique used for this codebase's earlier "functions cannot be passed to Client Components" incident on the proposal feature, applied proactively here given that history. This caught one real bug before it shipped: `MilestoneManager` and `ProgressAccessPanel` (both Client Components, SSR-then-hydrated) formatted dates with `toLocaleDateString()` and no explicit locale, which resolves to each environment's own default locale — Node's SSR output ("25/09/2026") disagreed with the browser's hydration output ("25/9/2026"), and React flagged a hydration mismatch. Fixed by pinning the locale to `"en-GB"` in both components. (`ProgressContentView`'s own unpinned date calls were left as-is — it's a plain Server Component, rendered only from the public route and the staff preview route, neither of which ever hydrates it client-side; the existing `ProposalContentView` has the identical unpinned pattern, confirmed safe there for the same reason.) The test route, its one-line `proxy.ts` RESERVED-path addition, and the temporarily-installed `playwright` package were all removed after verification; none is part of this diff.
- Also fixed, while investigating a suite-wide test run: a genuinely pre-existing, time-of-day-dependent flaky test in the **follow-up feature** (already on `main`) — `tests/followups/list-and-overview.test.ts`'s "due today" fixture used a fixed `now + 1 hour` offset, which crosses into "tomorrow" in the org's timezone whenever the suite happens to run within an hour of local midnight (which it did, live, while running this session's full suite). Fixed by clamping the fixture to stay within today's actual boundary using the feature's own `getTodayBoundsInZone` helper.
- Manually traced (not live-clicked past the auth boundary, since it requires real Supabase OTP login which isn't automatable here) the full `create project → add milestones → upload photos → save draft → approve and publish → open customer link → publish another update → revoke/rotate link → verify old access fails` workflow against the actual server action code paths, the DB schema/constraints, and the live-verified storage pipeline above.

## Rollback

Both migrations and the storage provisioning script are additive, so rolling back the *code* is safe without also rolling back the database — the new tables/bucket simply go unused. If you do want to remove them:

```sql
-- construct schema
ALTER TABLE construct.progress_photos DROP CONSTRAINT IF EXISTS progress_photos_exactly_one_source;
DROP TABLE IF EXISTS construct.progress_snapshots;
DROP TABLE IF EXISTS construct.progress_photos;
DROP TABLE IF EXISTS construct.progress_updates;
DROP TABLE IF EXISTS construct.progress_milestones;
DROP TABLE IF EXISTS construct.progress_projects;
DROP TYPE IF EXISTS construct."ProgressUpdateStatus";
DROP TYPE IF EXISTS construct."ProgressMilestoneStatus";
DROP TYPE IF EXISTS construct."ProgressLifecycle";
```

```sql
-- Supabase Storage — deletes the bucket AND every object in it. Only
-- run this if you're certain no progress photos need to be retained.
DELETE FROM storage.objects WHERE bucket_id = 'construct-progress-media';
DELETE FROM storage.buckets WHERE id = 'construct-progress-media';
```

```sql
-- control schema (only removes the PRIVATE_PROJECT_PROGRESS rows, not the plans themselves)
DELETE FROM control.plan_entitlements WHERE feature_code = 'PRIVATE_PROJECT_PROGRESS';
```

## Known limitations (by design, for this version)

- Photographs only — no video, no confidential documents, no bulk/gallery publishing to the public site (all explicitly out of scope per the product spec).
- No progress-project quota — only the boolean entitlement gates the feature, per the spec's explicit instruction not to invent quotas in this version.
- Signed photo URLs are short-lived (10 minutes) and freshly issued on every page render — an already-issued URL can keep working for up to that long after a revoke, exactly as the spec anticipates ("an already issued URL may remain valid briefly until it expires").
- No drag-and-drop reordering for milestones or the photo grid — up/down and left/right arrow buttons, matching the pattern already used elsewhere in this dashboard (`ProposalItemList`, `MilestoneManager`'s own follow-up-feature sibling).
- Caption entry happens at upload time only — there's no separate "edit caption later" action for an already-uploaded photo in this version (remove and re-add to change one).
- Role/entitlement gating on server actions is verified by code review and by the DB/service-layer test suite, not by an automated end-to-end test that logs in as each role — that would require a real Supabase OTP session, which isn't automatable in this environment. This is the same limitation noted for the proposal and follow-up features' own test suites.
