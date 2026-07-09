export const siteConfig = {
  name: "2 Yards Studios",
  shortName: "2YS",

  tagline: "Design • Build • Deliver",

  description:
    "Architecture, Construction and Interior Design Studio based in Hyderabad.",

  url: "https://www.2yardsstudios.com",

  email: "info@2yardsstudios.com",

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
