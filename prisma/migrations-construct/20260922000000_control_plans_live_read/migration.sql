-- Mirrors TuiTrak's 0039_control_plans_live_read.sql design (the
-- reference implementation, C:\Projects\TuiTrakWeb): construct.plans keeps
-- only what has no equivalent in the shared shaoor-ai.com control plane's
-- own control.plans — Razorpay plan ids, the local seat/project/media
-- limits, and the isTrial/isFreeForever behavioral flags this app's own
-- cron and gating logic read. Pricing/marketing display fields
-- (price, currency, billing interval) move to a live read of
-- control.plans, so editing a price in the shared /admin/plans UI takes
-- effect here immediately, with no deploy — that's the whole point of
-- this migration. `name` deliberately stays local (not dropped, unlike
-- TuiTrak): lib/control/construct-subscription.service.ts's
-- getConstructCommercialAccess() reads it for fast, local-only gating
-- error messages and is explicitly out of scope to restructure for this.
--
-- Also reconciles construct.plans' codes to match control.plans' current
-- catalog for product SHAOOR_CONSTRUCT (confirmed live before writing
-- this): ENTERPRISE splits into ENTERPRISE_MONTHLY/ENTERPRISE_ANNUAL
-- (both keep the old ENTERPRISE row's limits), and TRIAL is re-added
-- (deleted in an earlier cleanup pass, before this plan redesign existed)
-- with the limits from the tenant's own finalized plan table screenshot.

ALTER TABLE construct.plans
  DROP COLUMN price_amount,
  DROP COLUMN price_currency,
  DROP COLUMN billing_interval;

INSERT INTO construct.plans (code, name, is_trial, is_free_forever, seat_limit, project_limit, media_limit)
SELECT 'ENTERPRISE_MONTHLY', name, is_trial, is_free_forever, seat_limit, project_limit, media_limit FROM construct.plans WHERE code = 'ENTERPRISE'
UNION ALL
SELECT 'ENTERPRISE_ANNUAL', name, is_trial, is_free_forever, seat_limit, project_limit, media_limit FROM construct.plans WHERE code = 'ENTERPRISE';

DELETE FROM construct.plans WHERE code = 'ENTERPRISE';

INSERT INTO construct.plans (code, name, is_trial, is_free_forever, seat_limit, project_limit, media_limit)
VALUES ('TRIAL', 'Construct Trial', true, false, 2, 5, 25)
ON CONFLICT (code) DO NOTHING;
