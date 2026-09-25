// A curated dropdown list, not a free-text field — keeps the workspace
// timezone setting to valid IANA zones without needing the full ~400-zone
// Intl.supportedValuesOf("timeZone") list in a <select>. Server-side
// validation (isValidTimezone in lib/followups/timezone.ts) is the real
// guard; this list is just what's offered in the UI. Weighted toward
// India (this product's primary market — see Organization.timezone's
// default) with a handful of other common business zones.
export const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "Asia/Kolkata", label: "India — Mumbai, Delhi, Kolkata (IST)" },
  { value: "Asia/Dubai", label: "UAE — Dubai (GST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Karachi", label: "Pakistan — Karachi (PKT)" },
  { value: "Asia/Dhaka", label: "Bangladesh — Dhaka (BST)" },
  { value: "Asia/Kathmandu", label: "Nepal — Kathmandu (NPT)" },
  { value: "Europe/London", label: "United Kingdom — London" },
  { value: "Europe/Berlin", label: "Central Europe — Berlin, Paris" },
  { value: "America/New_York", label: "US Eastern — New York" },
  { value: "America/Chicago", label: "US Central — Chicago" },
  { value: "America/Denver", label: "US Mountain — Denver" },
  { value: "America/Los_Angeles", label: "US Pacific — Los Angeles" },
  { value: "Australia/Sydney", label: "Australia — Sydney" },
  { value: "UTC", label: "UTC" },
];
