export const PROJECT_STATUS = [
  "Completed",
  "Ongoing",
] as const;

export const PROJECT_CATEGORIES = [
  "Residential",
  "Commercial",
  "Industrial",
  "Infrastructure",
] as const;

export const DEFAULT_PROJECT_IMAGE =
  "/images/projects/default.jpg";

  export const whyChooseUs = [
  {
    title: "Quality Construction",
    description: "...",
    icon: "quality",
  },
  // ...
];

export const AUTH = {
  COOKIE_NAME: "sam_session",

  SESSION_DAYS: 7,

  BCRYPT_ROUNDS: 12,
} as const;