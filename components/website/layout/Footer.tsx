import Image from "next/image";
import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

import { getPublicSiteSettings } from "@/lib/public-site-data";

export default async function Footer() {
  const settings = await getPublicSiteSettings();
  const year = new Date().getFullYear();

  const navigation = [
    { title: "Home", href: "/" },
    { title: "About", href: "/about" },
    { title: "Services", href: "/services" },
    { title: "Projects", href: "/projects" },
    { title: "Process", href: "/process" },
    { title: "Contact", href: "/contact" },
  ];

  return (
    <footer className="mt-20 border-t bg-slate-900 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">

        {/* Company */}

        <div>
          <Link href="/" className="mb-5 flex items-center gap-3">

            {settings.logo ? (
              <Image
                src={settings.logo}
                alt={settings.companyName}
                width={56}
                height={56}
                className="h-14 w-14 object-contain"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#0E4A7B] text-xl font-bold text-white">
                {settings.companyName.charAt(0)}
              </div>
            )}

            <div>
              <h3 className="text-2xl font-bold">
                {settings.companyName}
              </h3>

              {settings.tagline && (
                <p className="text-sm text-slate-400">
                  {settings.tagline}
                </p>
              )}
            </div>

          </Link>

          <p className="mb-6 text-slate-300">
            {settings.description}
          </p>

          <div className="flex gap-3">

            {settings.facebook && (
              <a
                href={settings.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="rounded-lg bg-slate-800 p-3 transition hover:bg-[#0E4A7B]"
              >
                <FaFacebookF />
              </a>
            )}

            {settings.instagram && (
              <a
                href={settings.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="rounded-lg bg-slate-800 p-3 transition hover:bg-[#0E4A7B]"
              >
                <FaInstagram />
              </a>
            )}

            {settings.linkedin && (
              <a
                href={settings.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="rounded-lg bg-slate-800 p-3 transition hover:bg-[#0E4A7B]"
              >
                <FaLinkedinIn />
              </a>
            )}

            {settings.twitter && (
              <a
                href={settings.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="rounded-lg bg-slate-800 p-3 transition hover:bg-[#0E4A7B]"
              >
                <FaXTwitter />
              </a>
            )}

            {settings.youtube && (
              <a
                href={settings.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="rounded-lg bg-slate-800 p-3 transition hover:bg-[#0E4A7B]"
              >
                <FaYoutube />
              </a>
            )}

          </div>
        </div>

        {/* Navigation */}

        <div>
          <h4 className="mb-4 text-lg font-semibold">
            Quick Links
          </h4>

          <ul className="space-y-3">

            {navigation.map((item) => (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className="text-slate-300 transition hover:text-white"
                >
                  {item.title}
                </Link>
              </li>
            ))}

          </ul>
        </div>

        {/* Contact */}

        <div>
          <h4 className="mb-4 text-lg font-semibold">
            Contact
          </h4>

          <div className="space-y-3 text-slate-300">

            {settings.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="block transition hover:text-white"
              >
                {settings.phone}
              </a>
            )}

            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                className="block transition hover:text-white"
              >
                {settings.email}
              </a>
            )}

            {settings.addressLine1 && (
              <p>{settings.addressLine1}</p>
            )}

            {settings.addressLine2 && (
              <p>{settings.addressLine2}</p>
            )}

            {(settings.city || settings.state) && (
              <p>
                {settings.city}
                {settings.city && settings.state ? ", " : ""}
                {settings.state}
              </p>
            )}

            {(settings.country || settings.postalCode) && (
              <p>
                {settings.country}
                {settings.country && settings.postalCode ? " - " : ""}
                {settings.postalCode}
              </p>
            )}

            {settings.whatsApp && (
              <a
                href={`https://wa.me/${settings.whatsApp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block transition hover:text-white"
              >
                WhatsApp: {settings.whatsApp}
              </a>
            )}

          </div>
        </div>

        {/* CTA */}

        <div>
          <h4 className="mb-4 text-lg font-semibold">
            Ready to Build?
          </h4>

          <p className="mb-6 text-slate-300">
            Contact our team today and let&apos;s discuss your next construction project.
          </p>

          <Link
            href="/contact"
            className="inline-block rounded-lg bg-[#0E4A7B] px-6 py-3 font-semibold text-white! transition hover:bg-[#0A365A]"
          >
            Get a Quote
          </Link>
        </div>

      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-slate-400 md:flex-row">

          <div>
            © {year} {settings.companyName}. All rights reserved.
          </div>

          <div>
            Designed &amp; Developed by{" "}
            <span className="font-medium text-white">
              Mubeen
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
}
