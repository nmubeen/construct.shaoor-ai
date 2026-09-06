"use client";

import { Settings } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FaBars, FaPhone } from "react-icons/fa6";

import Navigation from "./Navigation";
import MobileMenu from "./MobileMenu";
import { websiteDesign } from "@/components/website/shared/design";
interface HeaderClientProps {
  settings: Settings;
}

export default function HeaderClient({
  settings,
}: HeaderClientProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Header band height halved (h-20 -> h-10): logo, name/tagline
          text, and the "Get a Quote" button padding are all scaled down
          to match, so nothing clips or overflows the shorter band.
          Background switched from the dark primary-to-black gradient to
          white — every foreground color below is flipped to its
          light-background counterpart to match (dark logo fallback text
          stays as-is since it's already on the accent-colored square,
          not the header background itself). */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white text-slate-900 shadow-sm">
        <div className={`${websiteDesign.container} flex h-10 items-center justify-between`}>

          {/* Logo */}

          <Link
            href="/"
            className="flex items-center gap-2"
          >
            {settings.logo ? (
              <Image
                src={settings.logo}
                alt={settings.companyName}
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--site-accent)] text-xs font-bold text-white">
                {settings.companyName.charAt(0)}
              </div>
            )}

            <div>
              <div className="text-sm leading-tight font-bold text-[var(--site-primary)]">
                {settings.companyName}
              </div>

              <div className="text-[10px] leading-tight text-slate-500">
                {settings.tagline}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}

          <div className="hidden lg:block">
            <Navigation />
          </div>

          {/* Right Side */}

          <div className="hidden items-center gap-4 lg:flex">

            {settings.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-[var(--site-primary)]"
              >
                <FaPhone />
                {settings.phone}
              </a>
            )}

            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md bg-[var(--site-primary)] px-4 py-1.5 text-sm font-medium text-white! shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--site-accent)] hover:shadow-lg"
            >
              Get a Quote
            </Link>

          </div>

          {/* Mobile Menu Button */}

          <button
            className="rounded-md p-1 text-slate-700 hover:bg-slate-100 lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open Menu"
          >
            <FaBars size={18} />
          </button>

        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        settings={settings}
      />
    </>
  );
}
