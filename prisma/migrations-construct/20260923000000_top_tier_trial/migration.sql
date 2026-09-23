-- Completes the switch to trialing the real top-tier plan directly
-- (lib/auth/provisioning.ts), instead of a dedicated "TRIAL" plan code —
-- mirrors TuiTrak's tuitrakweb.handle_new_user() model exactly. Plan.isTrial
-- is now unused everywhere in the app (confirmed by search before writing
-- this): the trial-expiry cron and the settings page both now derive
-- "is this org trialing" from subscriptions.status instead.
--
-- Reassigns any organization still sitting on plan_code = 'TRIAL' (from
-- before this fix existed) onto whichever plan control.plans currently
-- flags is_top_tier for SHAOOR_CONSTRUCT — exactly what a fresh signup
-- gets now — preserving trial_ends_at untouched. Falls back to FREE with
-- no trial if nothing is currently flagged top-tier, matching
-- lib/auth/provisioning.ts's own fallback.
DO $$
DECLARE
  v_plan_code text;
BEGIN
  SELECT cp.code INTO v_plan_code
  FROM control.plans cp
  JOIN control.products p ON p.id = cp.product_id
  WHERE p.code = 'SHAOOR_CONSTRUCT' AND cp.is_top_tier AND cp.is_active
  LIMIT 1;

  UPDATE construct.organizations
  SET plan_code = COALESCE(v_plan_code, 'FREE')
  WHERE plan_code = 'TRIAL';
END $$;

DELETE FROM construct.plans WHERE code = 'TRIAL';

ALTER TABLE construct.plans DROP COLUMN is_trial;
