"use client";

import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import Navigation from "./Navigation";
import { Settings } from "@prisma/client";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
}

export default function MobileMenu({
  open,
  onClose,
  settings,
}: MobileMenuProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}

      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-screen w-80 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        {/* Header */}

        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-xl font-bold">
              {settings.companyName}
            </h2>

            <p className="text-xs text-slate-500">
              {settings.tagline}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <FaTimes />
          </button>
        </div>

        {/* Navigation */}

        <div className="flex-1 p-6">
          <Navigation
            vertical
            onNavigate={onClose}
          />
        </div>

        {/* Footer */}

        <div className="border-t p-6">

          <a
            href={`tel:${settings.phone}`}
            className="mb-3 block rounded-lg bg-(--primary) px-4 py-3 text-center text-white! transition hover:bg-(--primary-dark)"
          >
            📞 Call Now
          </a>

          <a
            href="/contact"
            onClick={onClose}
            className="block rounded-lg border border-(--primary) px-4 py-3 text-center text-(--primary) transition hover:bg-slate-50"
          >
            Get a Quote
          </a>

        </div>
      </aside>
    </>
  );
}