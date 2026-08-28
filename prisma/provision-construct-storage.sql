INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'construct-media',
  'construct-media',
  true,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'application/pdf'
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
    WHERE id = 'construct-media'
      AND name = 'construct-media'
  ) THEN
    RAISE EXCEPTION 'construct-media bucket provisioning failed';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION construct.can_manage_media(target_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM construct.memberships AS membership
    INNER JOIN construct.organizations AS organization
      ON organization.id = membership.organization_id
    WHERE membership.organization_id = target_organization_id
      AND membership.user_id = auth.uid()
      AND membership.role <> 'VIEWER'::construct."MembershipRole"
      AND organization.status = 'ACTIVE'::construct."OrganizationStatus"
  );
$$;

REVOKE ALL ON FUNCTION construct.can_manage_media(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA construct TO authenticated;
GRANT EXECUTE ON FUNCTION construct.can_manage_media(uuid) TO authenticated;

DROP POLICY IF EXISTS construct_media_insert ON storage.objects;
CREATE POLICY construct_media_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'construct-media'
  AND construct.can_manage_media(((storage.foldername(name))[1])::uuid)
);

DROP POLICY IF EXISTS construct_media_update ON storage.objects;
CREATE POLICY construct_media_update
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'construct-media'
  AND construct.can_manage_media(((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'construct-media'
  AND construct.can_manage_media(((storage.foldername(name))[1])::uuid)
);

DROP POLICY IF EXISTS construct_media_delete ON storage.objects;
CREATE POLICY construct_media_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'construct-media'
  AND construct.can_manage_media(((storage.foldername(name))[1])::uuid)
);
