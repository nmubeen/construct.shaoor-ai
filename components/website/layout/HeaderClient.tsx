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
      <header className="sticky top-0 z-50 border-b border-black/20 bg-linear-to-b from-[#094136] to-black text-white shadow-[0_4px_20px_rgba(0,0,0,.25)] backdrop-blur">
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
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#7D9D76] font-bold text-white">
                {settings.companyName.charAt(0)}
              </div>
            )}

            <div>
              <div className="text-lg font-bold text-white">
                {settings.companyName}
              </div>

              <div className="text-xs text-white/60">
                {settings.tagline}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}

          <div className="hidden lg:block">
            <Navigation inverse />
          </div>

          {/* Right Side */}

          <div className="hidden items-center gap-4 lg:flex">

            {settings.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="flex items-center gap-2 text-sm font-medium text-white/85 transition hover:text-[#7D9D76]"
              >
                <FaPhone />
                {settings.phone}
              </a>
            )}

            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md bg-white px-5 py-3 font-medium text-[#094136]! shadow-sm transition hover:-translate-y-0.5 hover:bg-[#7D9D76] hover:text-white! hover:shadow-lg"
            >
              Get a Quote
            </Link>

          </div>

          {/* Mobile Menu Button */}

          <button
            className="rounded-md p-2 text-white hover:bg-white/10 lg:hidden"
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
