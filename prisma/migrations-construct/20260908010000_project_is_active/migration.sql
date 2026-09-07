-- Show/Hide for projects, mirroring Service.is_active: controls whether
-- a project appears on the public website independent of Featured
-- (which only controls homepage prominence).
ALTER TABLE construct.projects
  ADD COLUMN is_active boolean NOT NULL DEFAULT true;

CREATE INDEX projects_organization_id_is_active_idx
  ON construct.projects (organization_id, is_active);
