"use client";

import { useEffect } from "react";

export default function TenantNavigation({ prefix }: { prefix: string }) {
  useEffect(() => {
    if (!prefix) return;

    const routeTenantLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[href]");
      const href = link?.getAttribute("href");
      if (!link || !href || link.target === "_blank" || !href.startsWith("/")) return;
      if (href.startsWith(`${prefix}/`) || href === prefix || href.startsWith("/_next")) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(`${prefix}${href}`);
    };

    document.addEventListener("click", routeTenantLink, true);
    return () => document.removeEventListener("click", routeTenantLink, true);
  }, [prefix]);
  return null;
}
