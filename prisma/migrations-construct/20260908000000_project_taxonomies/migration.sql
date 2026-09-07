-- Tenant-managed picklists for Project.category and Project.status,
-- maintained from the Content page (mirrors the kind-discriminated
-- shape of construct.sub_services / the Content page's own team/client/
-- testimonial/faq unification, rather than two near-identical tables).
-- Values are always uppercase and <=20 characters — enforced by the
-- server action that writes them, not by a DB constraint, matching how
-- every other text limit in this app is enforced (Zod, not CHECK).
CREATE TABLE construct.project_taxonomies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES construct.organizations(id) ON DELETE CASCADE,
  kind            text NOT NULL CHECK (kind IN ('CATEGORY', 'STATUS')),
  value           text NOT NULL,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, kind, value)
);

CREATE INDEX project_taxonomies_organization_id_kind_idx
  ON construct.project_taxonomies (organization_id, kind, sort_order);
