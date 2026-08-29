import { NextRequest, NextResponse } from "next/server";
import { rawPrisma } from "@/lib/prisma";
import { hasSupabasePublicEnvironment } from "@/lib/env/supabase";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

const RESERVED = new Set([
  "admin", "account", "auth", "dashboard", "login", "change-password", "api", "_next", "favicon.ico", "robots.txt", "sitemap.xml",
]);

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if ((first === "account" || first === "auth" || first === "dashboard") && hasSupabasePublicEnvironment()) {
    return updateSupabaseSession(request);
  }

  if (!first || RESERVED.has(first.toLowerCase()) || first.includes(".")) {
    const headers = new Headers(request.headers);
    headers.set("x-company-id", "0");
    headers.set("x-company-code", "Shaoor-Construct");
    if (pathname.startsWith("/admin") && pathname !== "/admin/companies" && pathname !== "/admin/login") {
      return NextResponse.redirect(new URL("/admin/companies", request.url));
    }
    return NextResponse.next({ request: { headers } });
  }

  const activeCompanies = await rawPrisma.company.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, code: true },
  });
  const company = activeCompanies.find(
    (candidate) => candidate.code.toLowerCase() === first.toLowerCase(),
  );

  if (!company) return NextResponse.next();

  const headers = new Headers(request.headers);
  headers.set("x-company-id", String(company.id));
  headers.set("x-company-code", company.code);

  const url = request.nextUrl.clone();
  url.pathname = `/${segments.slice(1).join("/")}` || "/";
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|uploads|images).*)"],
};
