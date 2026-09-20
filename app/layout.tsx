import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

// Geist is the one font for the whole app — Inter used to also be loaded
// (bound to --font-sans on <html>) but body's own geist.className always
// won on actual rendered text anyway, so it was dead weight everywhere
// except shadcn's CardTitle (the only thing using the font-heading/
// font-sans utility classes). Bound to --font-geist here so
// --site-font (globals.css) can default to it, then be overridden
// per-tenant later without touching this file again.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Construct by Shaoor AI",
    template: "%s | Construct by Shaoor AI",
  },
  description:
    "A complete construction company website and CMS platform by Shaoor AI Tech.",
  // Platform default tab icons. Declared here rather than as app/icon.*
  // files because Next always injects file-based icons ahead of any
  // `icons` metadata, which would stop a tenant's own favicon (set in
  // app/(website)/layout.tsx) from taking precedence on their site.
  icons: {
    icon: [
      { url: "/images/brand/favicon.ico", sizes: "48x48" },
      { url: "/images/brand/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/images/brand/apple-icon.png", sizes: "180x180" },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={cn("font-sans", geist.variable)}
    >
      <body className={geist.className}>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
