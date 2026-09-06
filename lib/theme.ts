const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** True for a strict 6-digit "#rrggbb" hex color — anything else (3-digit
 * shorthand, named colors, rgb(), or garbage) is rejected. Used both when
 * saving a tenant's theme choice and again defensively right before an
 * unvalidated value is interpolated into a raw `<style>` tag, since that's
 * exactly the kind of sink where a stray value could otherwise break out
 * of the CSS declaration. */
export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}

export const DEFAULT_SITE_THEME = {
  primary: "#094136",
  accent: "#7d9d76",
} as const;

/** Resolves a tenant's chosen colors against the defaults, rejecting
 * anything that isn't a valid hex string (belt-and-suspenders alongside
 * the same check at save time — this is the function standing right next
 * to where the value gets written into a `<style>` tag). */
export function resolveSiteTheme(primary: string | null | undefined, accent: string | null | undefined) {
  return {
    primary: primary && isValidHexColor(primary) ? primary : DEFAULT_SITE_THEME.primary,
    accent: accent && isValidHexColor(accent) ? accent : DEFAULT_SITE_THEME.accent,
  };
}
