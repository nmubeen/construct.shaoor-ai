"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FaBars, FaPhone } from "react-icons/fa6";

import Navigation from "./Navigation";
import MobileMenu from "./MobileMenu";

import { siteConfig } from "@/lib/site";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}

          <Link
            href="/"
            className="flex items-center gap-3"
          >
            {siteConfig.company.logo ? (
              <Image
                src={siteConfig.company.logo}
                alt={siteConfig.company.name}
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-(--primary) font-bold text-white">
                S
              </div>
            )}

            <div>
              <div className="text-lg font-bold">
                {siteConfig.company.name}
              </div>

              <div className="text-xs text-slate-500">
                {siteConfig.company.tagline}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}

          <div className="hidden lg:block">
            <Navigation />
          </div>

          {/* Right Side */}

          <div className="hidden items-center gap-4 lg:flex">

            <a
              href={`tel:${siteConfig.company.phone}`}
              className="flex items-center gap-2 text-sm font-medium hover:text-(--primary)"
            >
              <FaPhone />

              {siteConfig.company.phone}
            </a>

            <Link
              href="/contact"
              className="rounded-lg bg-(--primary) px-5 py-3 text-white transition hover:bg-(--primary-dark)"
            >
              Get a Quote
            </Link>

          </div>

          {/* Mobile Button */}

          <button
            className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
            onClick={() =>
              setMenuOpen(true)
            }
            aria-label="Open Menu"
          >
            <FaBars size={22} />
          </button>

        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() =>
          setMenuOpen(false)
        }
      />
    </>
  );
}