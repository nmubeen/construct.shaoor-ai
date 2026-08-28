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
};

export default nextConfig;
