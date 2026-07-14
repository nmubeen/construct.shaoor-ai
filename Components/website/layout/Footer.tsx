import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";

import { siteConfig } from "@/lib/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t bg-slate-900 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">

        {/* Company */}

        <div>
          <h3 className="mb-4 text-2xl font-bold">
            {siteConfig.company.name}
          </h3>

          <p className="mb-6 text-slate-300">
            {siteConfig.company.description}
          </p>

          <div className="flex gap-3">

            {siteConfig.social.facebook && (
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-slate-800 p-3 transition hover:bg-(--primary)"
              >
                <FaFacebookF />
              </a>
            )}

            {siteConfig.social.instagram && (
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-slate-800 p-3 transition hover:bg-(--primary)"
              >
                <FaInstagram />
              </a>
            )}

            {siteConfig.social.linkedin && (
              <a
                href={siteConfig.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-slate-800 p-3 transition hover:bg-(--primary)"
              >
                <FaLinkedinIn />
              </a>
            )}

            {siteConfig.social.youtube && (
              <a
                href={siteConfig.social.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-slate-800 p-3 transition hover:bg-(--primary)"
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

            {siteConfig.navigation.map((item) => (
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

            <p>
              {siteConfig.company.phone}
            </p>

            <p>
              {siteConfig.company.email}
            </p>

            <p>
              {siteConfig.address.line1}
            </p>

            <p>
              {siteConfig.address.country}
            </p>

          </div>
        </div>

        {/* CTA */}

        <div>
          <h4 className="mb-4 text-lg font-semibold">
            Ready to Build?
          </h4>

          <p className="mb-6 text-slate-300">
            Contact our team today and
            let's discuss your next
            project.
          </p>

          <Link
            href="/contact"
            className="inline-block rounded-lg bg-(--primary) px-6 py-3 text-white transition hover:bg-(--primary-dark)"
          >
            Get a Quote
          </Link>

        </div>

      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-slate-400 md:flex-row">

          <div>
            © {year} {siteConfig.company.name}. All rights reserved.
          </div>

          <div>
            Designed & Developed by 2Yards Studios
          </div>

        </div>
      </div>
    </footer>
  );
}