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
      <header className="sticky top-0 z-50 border-b border-[#dce5da] bg-white/95 shadow-[0_4px_20px_rgba(9,65,54,.05)] backdrop-blur">
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
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#094136] font-bold text-white">
                {settings.companyName.charAt(0)}
              </div>
            )}

            <div>
              <div className="text-lg font-bold">
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
                className="flex items-center gap-2 text-sm font-medium transition hover:text-[#7D9D76]"
              >
                <FaPhone />
                {settings.phone}
              </a>
            )}

            <Link
              href="/contact"
              className={websiteDesign.primaryButton + " px-5 py-3 font-medium text-white!"}
            >
              Get a Quote
            </Link>

          </div>

          {/* Mobile Menu Button */}

          <button
            className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
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
