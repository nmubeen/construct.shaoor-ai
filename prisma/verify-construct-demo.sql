DO $$
DECLARE
  matched_count integer;
BEGIN
  SELECT count(*)
  INTO matched_count
  FROM construct.organizations AS organization
  JOIN construct.memberships AS membership
    ON membership.organization_id = organization.id
   AND membership.role = 'OWNER'
  JOIN construct.users AS owner
    ON owner.id = membership.user_id
   AND owner.email = '717meister@gmail.com'
  JOIN construct.site_settings AS settings
    ON settings.organization_id = organization.id
  JOIN construct.site_publications AS publication
    ON publication.organization_id = organization.id
   AND publication.status = 'DRAFT'
  JOIN construct.domains AS domain
    ON domain.organization_id = organization.id
   AND domain.hostname = 'demo.construct.shaoor-ai.com'
  WHERE organization.slug = 'demo'
    AND organization.status = 'ACTIVE';

  IF matched_count <> 1 THEN
    RAISE EXCEPTION 'Demo tenant verification failed; matched % complete tenants', matched_count;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM construct.audit_logs AS audit
    JOIN construct.organizations AS organization
      ON organization.id = audit.organization_id
    WHERE organization.slug = 'demo'
      AND audit.action = 'provision'
  ) THEN
    RAISE EXCEPTION 'Demo tenant provisioning audit record is missing';
  END IF;
END $$;
