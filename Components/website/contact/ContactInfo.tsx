import { Settings } from "@prisma/client";

import {
  FaEnvelope,
  FaLocationDot,
  FaPhone,
} from "react-icons/fa6";

interface ContactInfoProps {
  settings: Settings;
}

export default function ContactInfo({
  settings,
}: ContactInfoProps) {
  return (
    <div className="rounded-2xl bg-slate-50 p-8 shadow-sm">

      <h2 className="mb-2 text-3xl font-bold">
        Contact Information
      </h2>

      <p className="mb-10 text-slate-600">
        We&apos;d love to hear about your project.
        Reach out using any of the methods below.
      </p>

      <div className="space-y-10">

        <div className="flex gap-5">
          <FaLocationDot className="mt-1 text-2xl text-[#0E4A7B]" />

          <div>
            <h3 className="mb-1 font-semibold">
              Office Address
            </h3>

            <p className="text-slate-600">
              {settings.addressLine1}
            </p>

            {settings.addressLine2 && (
              <p className="text-slate-600">
                {settings.addressLine2}
              </p>
            )}

            <p className="text-slate-600">
              {settings.city}
              {settings.city && settings.state ? ", " : ""}
              {settings.state}
            </p>

            <p className="text-slate-600">
              {settings.country}
              {settings.country && settings.postalCode
                ? ` - ${settings.postalCode}`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex gap-5">
          <FaPhone className="mt-1 text-2xl text-[#0E4A7B]" />

          <div>
            <h3 className="mb-1 font-semibold">
              Phone
            </h3>

            <a
              href={`tel:${settings.phone}`}
              className="text-slate-600 hover:text-[#0E4A7B]"
            >
              {settings.phone}
            </a>

            {settings.whatsApp && (
              <div className="mt-2">
                <a
                  href={`https://wa.me/${settings.whatsApp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline"
                >
                  Chat on WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-5">
          <FaEnvelope className="mt-1 text-2xl text-[#0E4A7B]" />

          <div>
            <h3 className="mb-1 font-semibold">
              Email
            </h3>

            <a
              href={`mailto:${settings.email}`}
              className="text-slate-600 hover:text-[#0E4A7B]"
            >
              {settings.email}
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
