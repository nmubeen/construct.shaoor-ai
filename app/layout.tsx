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
