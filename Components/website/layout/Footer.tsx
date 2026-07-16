import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";

import { getSiteSettings } from "@/lib/settings";

export default async function Footer() {
  const settings = await getSiteSettings();
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
          <h3 className="mb-4 text-2xl font-bold">
            {settings.companyName}
          </h3>

          <p className="mb-6 text-slate-300">
            {settings.description || settings.tagline}
          </p>

          <div className="flex gap-3">

            {settings.facebook && (
              <a
                href={settings.facebook}
                target="_blank"
                rel="noopener noreferrer"
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
                className="rounded-lg bg-slate-800 p-3 transition hover:bg-[#0E4A7B]"
              >
                <FaLinkedinIn />
              </a>
            )}

            {settings.youtube && (
              <a
                href={settings.youtube}
                target="_blank"
                rel="noopener noreferrer"
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

          <div className="space-y-2 text-slate-300">

            {settings.phone && (
              <p>{settings.phone}</p>
            )}

            {settings.email && (
              <p>{settings.email}</p>
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
              <p>
                WhatsApp: {settings.whatsApp}
              </p>
            )}

          </div>
        </div>

        {/* CTA */}

        <div>
          <h4 className="mb-4 text-lg font-semibold">
            Ready to Build?
          </h4>

          <p className="mb-6 text-slate-300">
            Contact our team today and let's discuss your next project.
          </p>

          <Link
            href="/contact"
            className="inline-block rounded-lg bg-[#0E4A7B] px-6 py-3 font-semibold text-white transition hover:bg-[#0A365A]"
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
              2Yards Studios
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
}