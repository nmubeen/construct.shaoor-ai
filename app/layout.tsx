import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { getSiteSettings } from "@/lib/settings";
import { getTenantContext } from "@/lib/tenant";
import TenantNavigation from "@/components/tenant/TenantNavigation";
import { isConstructProductRequest } from "@/lib/construct-host";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geist = Geist({
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  if (await isConstructProductRequest()) {
    return {
      title: {
        default: "Construct by Shaoor AI",
        template: "%s | Construct by Shaoor AI",
      },
      description:
        "A complete construction company website and CMS platform by Shaoor AI Tech.",
    };
  }

  const settings = await getSiteSettings();

  return {
    title: settings.companyName || settings.seoTitle,
    description:
      settings.seoDescription ||
      settings.description ||
      "Architecture & Construction",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isConstructRequest = await isConstructProductRequest();
  const tenantPrefix = isConstructRequest
    ? null
    : (await getTenantContext()).urlPrefix;

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={cn("font-sans", inter.variable)}
    >
      <body className={geist.className}>
        {tenantPrefix !== null ? (
          <TenantNavigation prefix={tenantPrefix} />
        ) : null}
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
