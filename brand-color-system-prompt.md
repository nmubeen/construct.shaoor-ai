# Brand Color System Prompt

Copy everything below into Claude Code (or paste as your instruction) in the other website's repo.

---

Define the following CSS custom properties as our brand color system, and apply them consistently across the app.

## 1. Add these variables

In the project's global stylesheet (e.g. `globals.css`, inside `:root`), add:

```css
:root {
  /* Diagonal gradients, all top-left to bottom-right */
  --gradient-primary-bg: linear-gradient(to bottom right, #0375d0, #000000);
  --gradient-secondary-bg: linear-gradient(to bottom right, #83cceb, #0375d0);
  --gradient-button-bg: linear-gradient(to bottom right, #042964, #0375d0);
  --gradient-form-bg: linear-gradient(to bottom right, #ffffff, #83cceb);

  /* Flat colors */
  --color-primary-text: #0375d0;
  --color-secondary-text-icon: #83cceb;
}
```

Adjust the six hex values to this project's actual brand colors if they differ — keep the variable **names** and the **gradient direction** (top-left → bottom-right) the same.

## 2. What each one is for

- **PrimaryBackgroundColor** (`--gradient-primary-bg`) — the main page-header / nav-sidebar background band across the admin or app chrome (not the public marketing site, if this project has one with its own tenant/customer theme — see the guardrail below).
- **SecondaryBackgroundColor** (`--gradient-secondary-bg`) — accents, badges, and secondary highlight boxes.
- **ButtonBackgroundColor** (`--gradient-button-bg`) — every primary/solid call-to-action button.
- **FormBackgroundColor** (`--gradient-form-bg`) — the background of form-field cards/sections (not individual inputs, and not the sticky save-action bar — those stay plain white).
- **PrimaryTextColor** (`--color-primary-text`) — page headers, form-section headers, and any other heading/link/icon that previously used the old brand accent color.
- **SecondaryTextColor** (`--color-secondary-text-icon`) — secondary labels, small uppercase eyebrows, and icons paired with primary-colored headings.

## 3. How to apply them (Tailwind v4 project)

- Gradient variables are `background-image`s, not solid colors — apply with the parenthesized `image:` syntax: `bg-(image:--gradient-button-bg)`.
- Flat color variables apply the normal way: `text-(--color-primary-text)`.
- For a button using a gradient background, don't add a separate `hover:bg-*` — use `hover:brightness-110` (or `hover:brightness-95` on a light/white gradient like FormBackgroundColor) so the hover state scales with whatever the variable currently holds.

## 4. Where to apply each one — go through the whole app and update

1. Every page header / top banner background → PrimaryBackgroundColor.
2. Every solid/primary button background → ButtonBackgroundColor, white text.
3. Every form-field-group card background → FormBackgroundColor.
4. Secondary accent boxes, badges → SecondaryBackgroundColor.
5. Page headings and form-section headings → PrimaryTextColor.
6. Secondary/small labels and icons → SecondaryTextColor.

Do this as a full sweep — grep for hardcoded hex values or Tailwind color utilities currently doing these jobs (e.g. old brand colors used as `bg-[#xxxxxx]`, `text-blue-*`, `text-slate-900` on headings, etc.) and replace them with the matching variable, rather than only fixing the pages you happen to open.

## 5. Guardrails — read before making changes

- **If this project has a public-facing site with its own per-tenant/customer theme system** (a separate "site primary/accent" color a customer can configure), **do not** touch that theme or its own CSS variables. This brand color system is only for your own product's chrome (admin panel, dashboard, login/auth screens) — never for content the end customer customizes and owns visually.
- Check whether a global base-layer CSS rule already sets a default heading color (e.g. something like `.admin-surface h1, h2, h3 { color: ... }`). If so, any header you place on a colored/gradient background needs an *explicit* text-color class — inheriting from a parent won't beat a rule that targets the heading element directly, even if that rule has lower specificity, because inheritance always loses to a rule that matches the element itself, regardless of the layer or specificity involved.
- Before bulk-editing with a script/find-replace, verify each match is really a "form background," "button," etc. — a naive `bg-white` → `bg-(image:--gradient-form-bg)` sweep will also catch plain text inputs, tag/chip pills, and data-list rows that share the same class name but aren't actually forms. Check each hit's surrounding markup first.
- Keep `danger`/destructive buttons (delete, remove) on their own red styling — don't switch those to ButtonBackgroundColor, since red carries real meaning there.
