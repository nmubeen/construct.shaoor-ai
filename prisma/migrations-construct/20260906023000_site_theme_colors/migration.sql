-- Per-tenant website theming: lets each Construct organization pick its
-- own primary/accent colors for its PUBLIC website (not the dashboard,
-- admin, or auth chrome, which stay on Shaoor's own fixed brand). NULL
-- means "use Shaoor's default brand colors" — existing tenants see no
-- visual change until they open the branding section in Settings.
ALTER TABLE construct.site_settings
  ADD COLUMN theme_primary_color text,
  ADD COLUMN theme_accent_color text;
