-- Idempotent fresh Demo tenant. Run only after the Construct schema exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE lower(email) = '717meister@gmail.com'
  ) THEN
    RAISE EXCEPTION 'The approved Demo Owner does not exist in Supabase Auth';
  END IF;
END $$;

INSERT INTO construct.users (id, email, full_name, created_at, updated_at)
SELECT
  id,
  lower(email),
  NULLIF(trim(raw_user_meta_data ->> 'full_name'), ''),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM auth.users
WHERE lower(email) = '717meister@gmail.com'
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO construct.organizations (id, name, slug, status, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Demo Construction Company',
  'demo',
  'ACTIVE',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO construct.memberships (
  id,
  organization_id,
  user_id,
  role,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  organization.id,
  owner.id,
  'OWNER',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM construct.organizations AS organization
CROSS JOIN construct.users AS owner
WHERE organization.slug = 'demo'
  AND owner.email = '717meister@gmail.com'
ON CONFLICT (organization_id, user_id) DO UPDATE
SET role = 'OWNER',
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO construct.site_settings (
  organization_id,
  company_name,
  tagline,
  description,
  phone,
  email,
  address_line_1,
  city,
  country,
  hero_title,
  hero_subtitle,
  cta_title,
  cta_subtitle,
  cta_button_text,
  cta_button_link,
  created_at,
  updated_at
)
SELECT
  id,
  'Demo Construction Company',
  'Building with confidence',
  'A demonstration website powered by Shaoor Construct.',
  '+91 00000 00000',
  'demo@example.com',
  'Demo address',
  'Hyderabad',
  'India',
  'Spaces built for what comes next',
  'Explore a modern construction company website managed with Shaoor Construct.',
  'Discuss your next project',
  'Tell us what you are planning and our team will get in touch.',
  'Contact us',
  '/contact',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM construct.organizations
WHERE slug = 'demo'
ON CONFLICT (organization_id) DO NOTHING;

INSERT INTO construct.site_publications (
  organization_id,
  status,
  created_at,
  updated_at
)
SELECT id, 'DRAFT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM construct.organizations
WHERE slug = 'demo'
ON CONFLICT (organization_id) DO NOTHING;

INSERT INTO construct.domains (
  id,
  organization_id,
  hostname,
  status,
  verification_token,
  is_primary,
  verified_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  id,
  'demo.construct.shaoor-ai.com',
  'PENDING',
  gen_random_uuid()::text,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM construct.organizations
WHERE slug = 'demo'
ON CONFLICT (hostname) DO NOTHING;

INSERT INTO construct.audit_logs (
  id,
  organization_id,
  actor_user_id,
  module,
  action,
  record_id,
  title,
  details,
  created_at
)
SELECT
  gen_random_uuid(),
  organization.id,
  owner.id,
  'organization',
  'provision',
  organization.id::text,
  'Demo organization provisioned',
  jsonb_build_object('slug', organization.slug, 'source', 'approved-seed'),
  CURRENT_TIMESTAMP
FROM construct.organizations AS organization
CROSS JOIN construct.users AS owner
WHERE organization.slug = 'demo'
  AND owner.email = '717meister@gmail.com'
  AND NOT EXISTS (
    SELECT 1
    FROM construct.audit_logs AS audit
    WHERE audit.organization_id = organization.id
      AND audit.action = 'provision'
      AND audit.record_id = organization.id::text
  );
