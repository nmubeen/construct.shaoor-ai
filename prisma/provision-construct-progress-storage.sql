-- Private object storage for customer project progress photographs.
-- Deliberately separate from the public "construct-media" bucket
-- (prisma/provision-construct-storage.sql) — those assets are meant to
-- be publicly readable website content; these are private
-- construction-site photographs that must never have a permanent
-- public URL.
--
-- Security model — deliberately DIFFERENT from construct-media's RLS
-- pattern, on purpose:
--
-- construct-media is public (`public: true`) and trusts the
-- AUTHENTICATED user's own Supabase session directly for INSERT/UPDATE/
-- DELETE via RLS policies scoped by construct.can_manage_media(), with
-- reads going through the public getPublicUrl() (no RLS needed for
-- reads on a public bucket).
--
-- construct-progress-media is private (`public: false`) and has NO
-- direct client-to-Supabase-Storage access path at all: every
-- upload/read/delete is mediated by this app's own Next.js server code
-- using the Supabase SERVICE ROLE client (lib/supabase/service.ts),
-- which bypasses Storage RLS entirely. That server code is the actual
-- authorizer — it re-validates organization membership, role and the
-- PRIVATE_PROJECT_PROGRESS entitlement (for staff operations) or the
-- bearer-link token, expiry, revocation, organization status and the
-- same entitlement (for the public customer route) BEFORE ever calling
-- Storage. Since there is no direct client access path to defend, no
-- storage.objects RLS policy is needed or added for this bucket — an
-- RLS policy here would be dead code that could never be exercised
-- (authenticated/anon roles are never used to touch this bucket) and
-- would risk creating a false sense of a second enforcement layer that
-- doesn't actually run. The bucket-level file_size_limit/
-- allowed_mime_types below remain as defense-in-depth regardless of
-- which client role uploads.
--
-- Do not add storage.objects policies for this bucket without first
-- introducing an actual direct-client access path that would need them.

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'construct-progress-media',
  'construct-progress-media',
  false,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'construct-progress-media'
      AND name = 'construct-progress-media'
      AND public = false
  ) THEN
    RAISE EXCEPTION 'construct-progress-media bucket provisioning failed (or was left public)';
  END IF;
END $$;
