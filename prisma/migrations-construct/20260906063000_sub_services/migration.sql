-- A single-column bullet list attached to a Service, capped at 10 per
-- service (enforced in saveConstructServiceAction, not here) — mirrors
-- construct.project_highlights exactly, same replace-all-on-save shape.
CREATE TABLE construct.sub_services (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  service_id      uuid NOT NULL REFERENCES construct.services(id) ON DELETE CASCADE,
  text            text NOT NULL,
  sort_order      integer NOT NULL DEFAULT 0
);

CREATE INDEX sub_services_organization_id_service_id_idx
  ON construct.sub_services (organization_id, service_id);
