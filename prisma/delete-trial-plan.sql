-- Deletes construct.plans' TRIAL row (Construct's own local Plan model —
-- NOT control.plans, the separate shared-schema copy used by
-- control.activate_shaoor_construct_account() for the admin dashboard;
-- that one is untouched here).
--
-- Confirmed safe from a foreign-key standpoint: 0 organizations currently
-- reference plan_code='TRIAL' (construct.organizations is empty), and
-- organizations.plan_code is the ONLY foreign key anywhere in the
-- `construct` schema that references construct.plans.
--
-- NOT safe from a product standpoint, by design/choice: once this row is
-- gone, EVERY new Construct signup fails immediately.
-- createConstructOrganizationForCurrentUser() (lib/auth/provisioning.ts)
-- hard-codes `planCode: "TRIAL"` on the INSERT it runs when someone
-- finishes /account/setup — with no TRIAL row to reference, that INSERT
-- violates the foreign key, the transaction rolls back, and the person
-- sees a generic "failed" error. This stays broken until either a new
-- construct.plans row exists (whatever code the new plan catalog uses —
-- update the hard-coded string above if it isn't "TRIAL") or that line of
-- code changes. Confirmed deliberate: run this now, not held until the
-- new plan catalog is ready.
--
-- Usage: run STEP 1 alone and read it, then run STEP 2 through COMMIT (or
-- ROLLBACK instead, if anything before COMMIT looks wrong).

-- ============================================================
-- STEP 1 — PREVIEW ONLY. Run this first and read the result.
-- ============================================================
SELECT code, name, price_amount, price_currency, billing_interval, is_trial, seat_limit, project_limit, media_limit
FROM construct.plans
WHERE code = 'TRIAL';

-- ============================================================
-- STEP 2 — Only after checking STEP 1's output.
-- ============================================================
BEGIN;

DELETE FROM construct.plans
WHERE code = 'TRIAL';

-- Review the row count Postgres reports above — expect 1. Then either:
COMMIT;
-- or, if anything looks wrong:
-- ROLLBACK;
