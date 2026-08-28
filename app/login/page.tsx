import { redirect } from "next/navigation";
import type { Metadata } from "next";

import LoginForm from "@/components/auth/LoginForm";
import { currentUser } from "@/lib/auth/auth";
import { getTenantContext, tenantPath } from "@/lib/tenant";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage() {
  const user = await currentUser();

  if (user) {
    redirect(await tenantPath("/admin/dashboard"));
  }

  const [tenant, settings] = await Promise.all([getTenantContext(), getSiteSettings()]);
  const configuredName = settings.companyName.trim();
  const companyName = configuredName && configuredName !== "Company Name"
    ? configuredName
    : tenant.companyCode;
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center">
          <span className="block text-3xl font-bold">{companyName}</span>
          <span className="mt-1 block text-xl font-semibold text-slate-700">Admin Login</span>
        </h1>

        <p className="mb-8 text-center text-slate-500">
          Sign in to continue
        </p>

        <LoginForm />
      </div>
    </div>
  );
}
