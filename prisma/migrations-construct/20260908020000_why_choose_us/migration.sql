-- "Why Choose Us" home section, made tenant-configurable (title,
-- subtitle, and up to 8 icon+title+description highlights) instead of
-- the hardcoded values WhyChooseUs.tsx shipped with. Title/subtitle get
-- a DEFAULT matching those hardcoded values, so every existing tenant's
-- site_settings row is seeded immediately without an app-level backfill;
-- the highlight rows (a list, not a scalar column) still need the usual
-- lazy-provision-on-first-read pattern, since a column default can't
-- seed related rows.
ALTER TABLE construct.site_settings
  ADD COLUMN why_choose_us_title text NOT NULL DEFAULT 'Building with Confidence',
  ADD COLUMN why_choose_us_subtitle text NOT NULL DEFAULT 'Every project is backed by professional expertise, disciplined execution, and a commitment to delivering exceptional results.';

CREATE TABLE construct.why_choose_us_highlights (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES construct.organizations(id) ON DELETE CASCADE,
  icon            text NOT NULL,
  title           text NOT NULL,
  description     text NOT NULL,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX why_choose_us_highlights_organization_id_sort_order_idx
  ON construct.why_choose_us_highlights (organization_id, sort_order);
