-- Part of the auth/subscription architecture unification, Phase 4:
-- Construct gets self-serve Razorpay checkout (mirroring Pets exactly) in
-- addition to the existing admin-only offline conversion path. Each paid
-- plan needs a pre-created Razorpay Plan id (created in the Razorpay
-- dashboard, same as Pets' menagerie.plans.razorpay_plan_id_monthly/annual)
-- before checkout can actually work for it — these columns start NULL;
-- checkout for a plan with no id configured is rejected with a clear
-- error rather than silently failing (see app/api/razorpay/subscription).
ALTER TABLE construct.plans
  ADD COLUMN razorpay_plan_id_monthly text,
  ADD COLUMN razorpay_plan_id_annual text;
