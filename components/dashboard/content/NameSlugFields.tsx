"use client";

import { useState } from "react";

// Mirrors components/dashboard/services/ServiceTitleSlugFields.tsx exactly
// (itself ported from the legacy admin's slugify()) — Team and Client, the
// two content types with a slug, never had this at all until now.
function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const Hint = ({ children }: { children: React.ReactNode }) => (
  <span className="mt-1 block text-xs font-normal text-slate-500">{children}</span>
);

export function NameSlugFields({
  nameLabel,
  isNew,
  defaultName,
  defaultSlug,
  inputClassName,
  labelClassName,
  nameMaxLength,
}: {
  nameLabel: string;
  isNew: boolean;
  defaultName?: string | null;
  defaultSlug?: string | null;
  inputClassName: string;
  labelClassName: string;
  nameMaxLength: number;
}) {
  const [name, setName] = useState(defaultName ?? "");
  const [slug, setSlug] = useState(defaultSlug ?? "");

  return (
    <>
      <label className={labelClassName}>
        {nameLabel}
        <Hint>Displayed publicly on the website. 2–{nameMaxLength} characters.</Hint>
        <input
          className={inputClassName}
          name="name"
          value={name}
          onChange={(event) => {
            const next = event.target.value;
            setName(next);
            if (isNew) setSlug(slugify(next));
          }}
          required
          minLength={2}
          maxLength={nameMaxLength}
        />
      </label>
      <label className={labelClassName}>
        Slug
        <Hint>Lowercase letters, numbers and hyphens only, no spaces. {isNew ? "Automatically generated from the name — edit it if you want a different address." : "Changing this moves the page to a new address; existing links to the old one will break."}</Hint>
        <input
          className={inputClassName}
          name="slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          required
        />
      </label>
    </>
  );
}
