-- Cuts Construct over from password-based auth (eager, trigger-driven
-- organization creation from signUp() metadata) to the shared OTP + public
-- app_memberships model (on-demand, membership-gated provisioning) —
-- mirrors TuiTrak/Pets' architecture. See lib/auth/provisioning.ts for the
-- on-demand replacement (a plain Prisma transaction, not a SQL function —
-- nothing here needs to run inside the auth.users INSERT transaction
-- anymore, since provisioning is no longer trigger-driven).
--
-- 1. Drop the trigger and its function — password-based signUp() no longer
--    exists, so raw_user_meta_data->>'construct_organization_name' is never
--    set and this trigger's body would never fire again anyway; dropped
--    outright rather than left dead.
-- 2. Wipe Construct's own test data accumulated under the password system
--    (product is still in testing, per explicit instruction) — scoped to
--    the `construct` schema only. Deliberately leaves the shared
--    `auth.users` table untouched: those identities are shared across
--    Pets/Chat/Construct, and a fresh OTP sign-in will simply
--    self-heal-provision a brand-new organization for them (see
--    lib/auth/construct-context.ts) — same effect as a clean slate from
--    Construct's own point of view, without touching another product's
--    data on a table Construct doesn't own.

DROP TRIGGER IF EXISTS on_auth_user_created_construct ON auth.users;
DROP FUNCTION IF EXISTS construct.handle_new_user();

-- construct.plans is a catalog table, not test data — left alone.
-- Every other construct.* table cascades from organizations/users.
TRUNCATE TABLE
  construct.organizations,
  construct.users,
  construct.control_sync_failures
RESTART IDENTITY CASCADE;
