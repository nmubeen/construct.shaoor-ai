-- A real folder tree for the Media Library, distinct from the legacy
-- construct.media.folder text column (kept as-is for backward
-- compatibility with rows uploaded before this table existed). Lets a
-- folder exist — and be created or deleted — with no media in it, which
-- a value merely derived from distinct Media.folder strings never could.
CREATE TABLE construct.media_folders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES construct.organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  parent_id       uuid REFERENCES construct.media_folders(id) ON DELETE CASCADE,
  path            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, path)
);

CREATE INDEX media_folders_organization_id_parent_id_idx
  ON construct.media_folders (organization_id, parent_id);

ALTER TABLE construct.media
  ADD COLUMN folder_id uuid REFERENCES construct.media_folders(id) ON DELETE SET NULL;

CREATE INDEX media_organization_id_folder_id_idx
  ON construct.media (organization_id, folder_id);
