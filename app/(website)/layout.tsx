import type { Metadata } from "next";

import Header from "@/components/website/layout/Header";
import Footer from "@/components/website/layout/Footer";

import { siteConfig } from "@/lib/site";

import "../globals.css";

export const metadata: Metadata = {
  title: siteConfig.seo.title,
  description: siteConfig.seo.description,
};

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />

      <main className="min-h-screen">
        {children}
      </main>

      <Footer />
    </>
  );
}