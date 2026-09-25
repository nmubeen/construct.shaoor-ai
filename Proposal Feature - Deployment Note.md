# Project Proposals — deployment note

## What shipped

- **construct.shaoor-ai.com**: 5 new tables (`proposals`, `proposal_revisions`, `proposal_portfolio_items`, `proposal_testimonial_items`, `proposal_responses`), 3 new enums, all purely additive — no existing column touched. New top-level public route `/proposals/[token]`, new dashboard section `/dashboard/proposals`, "Prepare proposal" added to the enquiry detail screen.
- **shaoor-ai.com** (shared control plane): one data-only migration seeding a new `PROJECT_PROPOSALS` boolean feature code into the existing, already-generic `control.plan_entitlements` table — no schema or admin-UI change there; it uses the same mechanism `CUSTOM_DOMAIN` already relies on.

## Migration order

1. **construct.shaoor-ai.com** — apply `prisma/migrations-construct/20260926000000_project_proposals/migration.sql` against the `construct` schema.
2. **shaoor-ai.com** — apply `prisma/migrations/20260926010000_construct_project_proposals_entitlement/migration.sql` against the `control` schema.

Order between the two doesn't matter functionally (they touch different schemas with no cross-dependency), but applying (1) first means the feature's tables exist before the entitlement that gates them goes live — the more conservative order if you're applying them on separate days.

Both were already applied directly to the shared Supabase instance during development (this is the same physical database both repos use, per shaoor-ai.com's own architecture — see its README's "Subscription control plane" section) and verified:

- All 5 tables + partial unique index (`proposals_one_open_draft_per_enquiry`, enforcing at most one open draft per enquiry at the database level) confirmed present.
- `PROJECT_PROPOSALS` confirmed `true` on `GROWTH_MONTHLY`, `GROWTH_ANNUAL`, `ENTERPRISE_MONTHLY`, `ENTERPRISE_ANNUAL`, and `false` on `STARTER_MONTHLY`, `STARTER_ANNUAL` (matches the exact tier split `SERVICE_ENQUIRIES` already uses).

No further manual step is needed for either migration — nothing here requires an app redeploy to take effect, since `enforceConstructBooleanEntitlement` reads `control.plan_entitlements` live, not from a cached or synced copy.

## Regenerating the Prisma client

After pulling these changes, run (both are already part of the existing `npm run build` script, but if you're only running `next dev`):

```
npx prisma generate --schema prisma/schema.postgresql.prisma
```

## Configuration

No new environment variables. The public proposal URL is built from `appUrl()` (`lib/construct-app-url.ts`), the same helper already used for team-invite links — no separate base URL to configure.

## New dev dependency

`vitest` (+ `vite` as its peer) were added as dev dependencies to run the new test suite (`npm test`) — this repo had no test framework before. Both are dev-only; nothing changes for the production build or runtime.

One thing worth knowing if you run `npm install` locally afterward: it can prune the generated `node_modules/@prisma/construct-client` directory (it's generated, not tracked in `package-lock.json`). If `npm test` or `next dev` then fails to find `@prisma/construct-client`, just re-run the `prisma generate` command above.

## Rollback

Both migrations are purely additive (new tables / new data rows), so rolling back the *code* (e.g. to the `checkpoint-2026-09-25-setup-guide` git tag from before this feature) is safe without also rolling back the database — the new tables and entitlement rows simply go unused. If you do want to remove them:

```sql
-- construct schema
DROP TABLE IF EXISTS construct.proposal_responses;
DROP TABLE IF EXISTS construct.proposal_testimonial_items;
DROP TABLE IF EXISTS construct.proposal_portfolio_items;
DROP TABLE IF EXISTS construct.proposal_revisions;
DROP TABLE IF EXISTS construct.proposals;
DROP TYPE IF EXISTS construct."ProposalResponseType";
DROP TYPE IF EXISTS construct."ProposalPriceMode";
DROP TYPE IF EXISTS construct."ProposalStatus";
```

```sql
-- control schema (only removes the PROJECT_PROPOSALS rows, not the plans themselves)
DELETE FROM control.plan_entitlements WHERE feature_code = 'PROJECT_PROPOSALS';
```

## Known limitations (by design, for this version)

- No AI-assisted drafting — the requirements summary and portfolio suggestions are deterministic and template-based. The snapshot/draft-generation services are structured so an AI rewrite step could be added later without touching the schema or the publish/snapshot flow.
- No quota on the number of proposals a plan can create — only the boolean entitlement gates the feature, per the spec's explicit scope for v1.
- No automatic email/WhatsApp sending — sharing is always a manual copy-link or WhatsApp-share action by the owner.
- View tracking is aggregate (first/last opened, approximate count), not a per-event log.
- No drag-and-drop reordering for portfolio/testimonial selection — up/down arrow buttons, matching the pattern already used for enquiry-question ordering elsewhere in the dashboard.
