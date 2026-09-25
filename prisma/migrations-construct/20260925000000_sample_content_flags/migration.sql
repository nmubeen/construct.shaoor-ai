-- Marks rows created by the default-content seeder (services + sub-services
-- + questions, and the 2 sample projects) so the dashboard can show a
-- "these are sample records" banner and clear it automatically once an
-- owner edits a sample into their own real content. See
-- lib/services/construct-service-seed.service.ts,
-- lib/services/construct-project-seed.service.ts, and the saveConstruct*
-- actions (which clear the flag on update).
ALTER TABLE construct.services ADD COLUMN is_sample boolean NOT NULL DEFAULT false;
ALTER TABLE construct.projects ADD COLUMN is_sample boolean NOT NULL DEFAULT false;
