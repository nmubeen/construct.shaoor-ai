"use client";

import { useState } from "react";

// Mirrors components/admin/services/ServiceForm.tsx's slugify exactly —
// same behavior, ported to the newer Construct dashboard form, which never
// got it. Auto-fills the slug from the title, but only while creating: once
// a service exists, the slug is left alone even if the title changes, since
// its slug is a real published URL by then.
function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function ServiceTitleSlugFields({
  isNew,
  defaultTitle,
  defaultSlug,
  inputClassName,
}: {
  isNew: boolean;
  defaultTitle?: string;
  defaultSlug?: string;
  inputClassName: string;
}) {
  const [title, setTitle] = useState(defaultTitle ?? "");
  const [slug, setSlug] = useState(defaultSlug ?? "");

  return (
    <>
      <label className="text-sm font-semibold text-slate-700">
        Title
        <span className="mt-1 block text-xs font-normal text-slate-500">
          Displayed publicly on the service card and its page. 2–120 characters.
        </span>
        <input
          className={inputClassName}
          name="title"
          value={title}
          onChange={(event) => {
            const nextTitle = event.target.value;
            setTitle(nextTitle);
            if (isNew) setSlug(slugify(nextTitle));
          }}
          required
          minLength={2}
          maxLength={120}
        />
      </label>
      <label className="text-sm font-semibold text-slate-700">
        Slug
        <span className="mt-1 block text-xs font-normal text-slate-500">
          Lowercase letters, numbers and hyphens only, no spaces (e.g. &quot;kitchen-remodeling&quot;). {isNew ? "Automatically generated from the title — edit it if you want a different address." : "Changing this moves the service to a new address; existing links to the old one will break."}
        </span>
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
