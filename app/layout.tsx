import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { getSiteSettings } from "@/lib/settings";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geist = Geist({
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: settings.companyName || settings.seoTitle,
    description:
      settings.seoDescription ||
      settings.description ||
      "Architecture & Construction",
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={cn("font-sans", inter.variable)}>
      <body className={geist.className}>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}