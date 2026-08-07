import type { MetadataRoute } from "next";

import { getDefaultSEO, resolveBaseUrl } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
    const seo = await getDefaultSEO();
    const baseUrl = resolveBaseUrl(seo.siteUrl);

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/admin",
                "/admin/*",
                "/admin/login",
                "/login",
                "/api",
                "/api/*",
                "/api/auth",
                "/api/auth/*",
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
