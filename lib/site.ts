export const siteConfig = {
  // Company Information
  company: {
    name: "SAM Constructions",
    tagline: "Building Excellence. Delivering Trust.",
    description:
      "A leading construction company delivering residential, commercial, industrial and infrastructure projects with uncompromising quality.",

    logo: "/logo.svg",

    email: "info@samconstructions.com",

    phone: "+971 XX XXX XXXX",

    whatsapp: "+971XXXXXXXXX",

    website: "https://www.samconstructions.com",
  },

  // Office Address
  address: {
    line1: "Dubai, UAE",
    city: "Dubai",
    state: "",
    country: "United Arab Emirates",
    postalCode: "",
  },

  // Navigation
  navigation: [
    {
      title: "Home",
      href: "/",
      children: [],
    },
    {
      title: "About",
      href: "/about",
      children: [],
    },
    {
      title: "Services",
      href: "/services",
      children: [],
    },
    {
      title: "Projects",
      href: "/projects",
      children: [],
    },
    {
      title: "Contact",
      href: "/contact",
      children: [],
    },
  ],

  // Social Media
  social: {
    facebook: "",

    instagram: "",

    linkedin: "",

    youtube: "",

    twitter: "",
  },

  // Homepage
  home: {
    heroTitle:
      "Building the Future with Quality & Integrity",

    heroSubtitle:
      "From luxury residences to large-scale commercial and infrastructure developments, we deliver projects that stand the test of time.",

    heroButtonText: "Explore Projects",

    heroButtonLink: "/projects",
  },

  // Call To Action
  cta: {
    title: "Let's Build Something Great Together",

    subtitle:
      "Talk to our team about your next construction project.",

    buttonText: "Get a Quote",

    buttonLink: "/contact",
  },

  // Default SEO
  seo: {
    title: "SAM Constructions",

    description:
      "Professional construction company specializing in residential, commercial, industrial and infrastructure projects.",

    keywords: [
      "construction",
      "civil engineering",
      "commercial construction",
      "residential construction",
      "contractor",
      "building company",
    ],

    image: "/og-image.jpg",
  },

  // Footer
  footer: {
    copyright: `© ${new Date().getFullYear()} SAM Constructions. All rights reserved.`,
  },
} as const;

export type SiteConfig = typeof siteConfig;

export type NavigationItem =
  (typeof siteConfig.navigation)[number];