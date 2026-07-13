export const siteConfig = {
  name: "SAM Constructions",
  shortName: "2YS",

  tagline: "Design • Build • Deliver",

  description:
    "Architecture, Construction and Interior Design Studio based in Hyderabad.",

  url: "https://www.samconstructions.com",

  email: "samconstructions@gmail.com",

  phone: "+91 XXXXX XXXXX",

  address: {
    line1: "Road No.12, Banjara Hills",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    pincode: "500034",
  },

  navigation: [
    { title: "Home", href: "/" },

    { title: "Studio", href: "/studio" },

    { title: "Services", href: "/services" },

    {
      title: "Projects",

      children: [
        {
          title: "Completed Projects",
          href: "/projects/completed",
        },

        {
          title: "Ongoing Projects",
          href: "/projects/ongoing",
        },
      ],
    },

    {
      title: "Our Process",
      href: "/process",
    },

    {
      title: "Contact",
      href: "/contact",
    },
  ],
};

export type SiteConfig = typeof siteConfig;
