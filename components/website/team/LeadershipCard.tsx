import Image from "next/image";
import type { PublicTeamMember } from "@/lib/public-site-data";
import {
  FaEnvelope,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";

interface LeadershipCardProps {
  member: PublicTeamMember;
}

const socialLinkClassName =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:-translate-y-0.5 hover:border-(--primary) hover:bg-(--primary) hover:text-white";

export default function LeadershipCard({ member }: LeadershipCardProps) {
  const photo = member.photo.trim();
  const initials = member.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
  const socialLinks = [
    member.email && {
      href: `mailto:${member.email}`,
      label: `Email ${member.name}`,
      icon: FaEnvelope,
    },
    member.linkedin && {
      href: member.linkedin,
      label: `${member.name} on LinkedIn`,
      icon: FaLinkedinIn,
    },
    member.instagram && {
      href: member.instagram,
      label: `${member.name} on Instagram`,
      icon: FaInstagram,
    },
    member.twitter && {
      href: member.twitter,
      label: `${member.name} on X`,
      icon: FaXTwitter,
    },
  ].filter(
    (
      link
    ): link is {
      href: string;
      label: string;
      icon: typeof FaEnvelope;
    } => Boolean(link)
  );

  return (
    <article className="group rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
      <div className="flex justify-center py-6">
        <div className="relative h-36 w-36 overflow-hidden rounded-full ring-4 ring-slate-100 transition duration-300 group-hover:ring-(--primary)/20">
          {photo ? (
            <Image
              src={photo}
              alt={member.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-slate-200 text-3xl font-semibold text-slate-600"
              aria-label={`${member.name} has no profile photo`}
            >
              {initials || "?"}
            </div>
          )}
        </div>
      </div>

      <h3 className="mt-6 text-xl font-semibold text-slate-900">
        {member.name}
      </h3>

      <p className="mt-1 text-sm font-medium text-(--primary)">
        {member.designation}
      </p>

      <p className="mt-4 text-sm leading-6 text-slate-600">
        {member.shortBio}
      </p>

      {socialLinks.length > 0 && (
        <div className="mt-5 flex justify-center gap-3">
          {socialLinks.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              aria-label={label}
              className={socialLinkClassName}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer" : undefined}
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
