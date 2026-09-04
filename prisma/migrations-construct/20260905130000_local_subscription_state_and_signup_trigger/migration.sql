-- Part of the auth/subscription architecture unification: Construct adopts
-- Pets' self-serve, trigger-driven, locally-sourced model (see the
-- approved plan for full context; pets.shaoor-ai.com and shaoor-ai.com's
-- own migrations from the same rollout are the other pieces).
--
-- Three things:
-- 1. A local plan/subscription catalog (construct.plans/subscriptions +
--    organizations.plan_code/trial_ends_at) — Construct's own fast source
--    of truth for gating, mirroring menagerie.tenants/subscriptions.
-- 2. A membership/invite rework — invited-but-unregistered members become
--    a status='INVITED' row with no user_id yet, reconciled by email match
--    at signup, mirroring menagerie.memberships. The existing token-based
--    construct.invitations table/flow stays live for already-emailed
--    accept links (see construct-team.actions.ts) — only NEW invites use
--    this pattern.
-- 3. construct.handle_new_user() — a new trigger on the SHARED auth.users
--    table (this Supabase project's identity table, used by Pets/Chat/
--    Construct alike), scoped by raw_user_meta_data->>'construct_organization_name'
--    presence so it never fires for a Pets/Chat signup — mirrors
--    menagerie.handle_new_user()'s own workspace_name-presence scoping.
--    Kept deliberately minimal (org + membership + subscription row only,
--    no SiteSettings/Domain/SitePublication defaults) — those stay
--    app-level, lazily created on first dashboard visit, keeping this
--    trigger's blast radius small since multiple products' triggers now
--    share one table and a bug in one must never block another's signups.

-- ---------------------------------------------------------------------
-- 1. Local plan/subscription catalog
-- ---------------------------------------------------------------------
CREATE TABLE construct.plans (
  code text PRIMARY KEY,
  name text NOT NULL,
  price_amount integer,
  price_currency text NOT NULL DEFAULT 'INR',
  billing_interval text,
  is_trial boolean NOT NULL DEFAULT false,
  is_free_forever boolean NOT NULL DEFAULT false,
  seat_limit integer,
  project_limit integer,
  media_limit integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO construct.plans (code, name, price_amount, billing_interval, is_trial, is_free_forever, seat_limit, project_limit, media_limit) VALUES
  ('TRIAL', 'Construct Trial', NULL, 'TRIAL', true, false, 2, 5, 25),
  ('FREE', 'Construct Free', 0, NULL, false, true, 2, 5, 25),
  ('STARTER_MONTHLY', 'Construct Starter Monthly', NULL, 'MONTHLY', false, false, 5, 20, 200),
  ('STARTER_ANNUAL', 'Construct Starter Annual', NULL, 'ANNUAL', false, false, 5, 20, 200),
  ('GROWTH_MONTHLY', 'Construct Growth Monthly', NULL, 'MONTHLY', false, false, 20, 100, 2000),
  ('GROWTH_ANNUAL', 'Construct Growth Annual', NULL, 'ANNUAL', false, false, 20, 100, 2000),
  ('ENTERPRISE', 'Construct Enterprise', NULL, 'CUSTOM', false, false, 1000000, 1000000, 1000000);

CREATE TYPE construct."SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');

CREATE TABLE construct.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES construct.organizations(id) ON DELETE CASCADE,
  status construct."SubscriptionStatus" NOT NULL,
  current_period_end timestamptz,
  razorpay_customer_id text,
  razorpay_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE construct.control_sync_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE construct.organizations
  ADD COLUMN plan_code text NOT NULL DEFAULT 'TRIAL' REFERENCES construct.plans(code),
  ADD COLUMN trial_ends_at timestamptz;

-- ---------------------------------------------------------------------
-- 2. Membership/invite rework
-- ---------------------------------------------------------------------
CREATE TYPE construct."MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'REMOVED');

ALTER TABLE construct.memberships
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN invited_email text,
  ADD COLUMN status construct."MembershipStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE UNIQUE INDEX memberships_org_invited_email_key
  ON construct.memberships (organization_id, invited_email)
  WHERE invited_email IS NOT NULL AND user_id IS NULL;

CREATE INDEX memberships_org_invited_email_idx ON construct.memberships (organization_id, invited_email);

-- One-time copy of any still-pending old-style invitations into the new
-- pattern, so /dashboard/team's "pending" list is complete going forward
-- even though it now reads memberships instead of the invitations table
-- for new invites. The old invitations rows themselves are left alone —
-- their accept links keep working during the deprecation window.
INSERT INTO construct.memberships (organization_id, invited_email, role, status)
SELECT organization_id, email, role, 'INVITED'
FROM construct.invitations
WHERE status = 'PENDING' AND expires_at > now()
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 3. Signup trigger
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION construct.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, construct, control
AS $$
DECLARE
  v_org_name text;
  v_org_slug text;
  v_email text;
  v_org_id uuid;
  v_correlation_id text;
BEGIN
  -- Defensive by design: multiple products' triggers now share this one
  -- table (AFTER INSERT triggers on the same row run in the same
  -- transaction, in order) — an unhandled exception here would block
  -- every product's signup, not just Construct's. Nothing in this
  -- function body is allowed to escape uncaught.
  BEGIN
    v_email := new.email;

    -- Unconditional, not just for org-creating signups: construct.memberships
    -- .user_id FKs to construct.users, not auth.users directly (unlike
    -- Pets, which has no local users-mirror table at all) — so ANY signup
    -- that might get reconciled into an invite below needs this row to
    -- exist first, or that UPDATE hits a foreign-key violation (confirmed
    -- live: an invite-only signup with no construct org metadata failed
    -- silently under the outer exception handler until an explicit test
    -- caught it). Mirrors what synchronizeConstructUser() already does on
    -- every sign-IN — this is the same upsert, just also on sign-up.
    INSERT INTO construct.users (id, email, full_name, updated_at)
      VALUES (new.id, v_email, NULLIF(btrim(COALESCE(new.raw_user_meta_data ->> 'full_name', '')), ''), now())
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = now();

    -- Reconcile any pending invite for this email, regardless of whether
    -- this signup also creates a brand-new organization below (matches
    -- menagerie.handle_new_user()'s own behavior exactly — a new user can
    -- simultaneously be the owner of a workspace they're creating and a
    -- reconciled member of one they were invited to).
    UPDATE construct.memberships
      SET user_id = new.id, status = 'ACTIVE'
      WHERE invited_email = v_email AND status = 'INVITED' AND user_id IS NULL;

    -- Only act on a Construct signup — every product's signup form passes
    -- its own metadata key, so this never fires for Pets/Chat.
    v_org_name := new.raw_user_meta_data ->> 'construct_organization_name';
    v_org_slug := new.raw_user_meta_data ->> 'construct_organization_slug';

    IF v_org_name IS NOT NULL AND length(btrim(v_org_name)) > 0
       AND v_org_slug IS NOT NULL AND v_org_slug ~ '^[a-z0-9]{2,32}$' THEN

      -- construct.organizations/users/memberships predate this migration
      -- and were modeled through Prisma, whose @default(uuid())/@updatedAt
      -- are CLIENT-side defaults, not database ones — id and updated_at
      -- have no DB default on any of them, so every insert here must
      -- supply both explicitly (confirmed live: the first version of this
      -- trigger omitted them and violated the id NOT NULL constraint,
      -- silently swallowed by the outer exception handler below until
      -- caught by a real end-to-end signup test).
      BEGIN
        INSERT INTO construct.organizations (id, name, slug, status, plan_code, trial_ends_at, updated_at)
          VALUES (gen_random_uuid(), btrim(v_org_name), v_org_slug, 'ACTIVE', 'TRIAL', now() + interval '14 days', now())
          RETURNING id INTO v_org_id;
      EXCEPTION WHEN unique_violation THEN
        -- Slug collision: append a short suffix rather than failing the
        -- whole signup over a cosmetic address clash.
        v_org_slug := v_org_slug || '-' || substr(replace(new.id::text, '-', ''), 1, 6);
        INSERT INTO construct.organizations (id, name, slug, status, plan_code, trial_ends_at, updated_at)
          VALUES (gen_random_uuid(), btrim(v_org_name), v_org_slug, 'ACTIVE', 'TRIAL', now() + interval '14 days', now())
          RETURNING id INTO v_org_id;
      END;

      INSERT INTO construct.memberships (id, organization_id, user_id, role, status, updated_at)
        VALUES (gen_random_uuid(), v_org_id, new.id, 'OWNER', 'ACTIVE', now());

      INSERT INTO construct.subscriptions (organization_id, status, current_period_end)
        VALUES (v_org_id, 'TRIALING', NULL);

      INSERT INTO construct.audit_logs (id, organization_id, actor_user_id, module, action, record_id, title, details)
        VALUES (gen_random_uuid(), v_org_id, new.id, 'organization', 'provision', v_org_id::text, 'Construct organization provisioned',
          jsonb_build_object('slug', v_org_slug, 'accessMode', 'trial', 'trialStartedAt', now()));

      -- Best-effort control-plane mirror — must never block signup.
      BEGIN
        v_correlation_id := 'construct-signup-' || v_org_id::text;
        PERFORM control.sync_shaoor_construct_subscription(
          v_org_id, btrim(v_org_name), new.id, v_email,
          'TRIAL', 'TRIALING', now() + interval '14 days',
          now(), NULL,
          'Self-service Construct trial signup', v_correlation_id
        );
      EXCEPTION WHEN OTHERS THEN
        INSERT INTO construct.control_sync_failures (organization_id, error) VALUES (v_org_id, SQLERRM);
      END;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Never block auth.users insert (i.e. never block ANY product's
    -- signup) over a bug in this function — but do surface it (visible in
    -- Supabase's Postgres logs) rather than swallowing it silently, which
    -- is exactly what let the first version of this trigger's id-column
    -- bug go undetected until an explicit end-to-end test caught it.
    RAISE WARNING 'construct.handle_new_user() failed for auth user %: %', new.id, SQLERRM;
  END;

  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created_construct
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION construct.handle_new_user();

REVOKE ALL ON FUNCTION construct.handle_new_user() FROM PUBLIC, anon, authenticated;
