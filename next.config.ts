import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : null;

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/construct-client"],
  outputFileTracingExcludes: {
    "*": [
      "./tmp/**",
      "./output/**",
      "./Pitch Assets/**",
      "./Infographic.jpg",
      "./Sample Data.docx",
    ],
  },
  images: {
    remotePatterns: supabaseHost ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : [],
  },
  // Private project-progress pages: more restrictive than the public
  // marketing site (sensitive construction photographs behind a bearer
  // link, not indexable content) — never cached, no referrer leakage to
  // whatever the visitor navigates to next, and an explicit robots
  // header as a second signal alongside the page's own <meta> robots tag.
  async headers() {
    return [
      {
        source: "/progress/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, no-cache, must-revalidate" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;
