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
      {/* Header band doubled back up (h-10 -> h-20): logo, name/tagline
          text, and the "Get a Quote" button padding are all scaled up to
          match. Background stays white (a separate fix from the height) —
          foreground colors below are the light-background set. */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white text-slate-900 shadow-sm">
        <div className={`${websiteDesign.container} flex h-20 items-center justify-between`}>

          {/* Logo */}

          <Link
            href="/"
            className="flex items-center gap-3"
          >
            {settings.logo ? (
              <Image
                src={settings.logo}
                alt={settings.companyName}
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[var(--site-accent)] font-bold text-white">
                {settings.companyName.charAt(0)}
              </div>
            )}

            <div>
              <div className="text-lg font-bold text-[var(--site-primary)]">
                {settings.companyName}
              </div>

              <div className="text-xs text-slate-500">
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
              className="inline-flex items-center justify-center rounded-md bg-[var(--site-primary)] px-5 py-3 font-medium text-white! shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--site-accent)] hover:shadow-lg"
            >
              Get a Quote
            </Link>

          </div>

          {/* Mobile Menu Button */}

          <button
            className="rounded-md p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open Menu"
          >
            <FaBars size={22} />
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
