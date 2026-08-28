import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import { currentUser } from "@/lib/auth/auth";
import { verifyPassword } from "@/lib/auth/password";
import { getSiteSettings } from "@/lib/settings";
import { getTenantContext, tenantPath } from "@/lib/tenant";

export default async function ChangePasswordPage() {
  const [user, tenant, settings] = await Promise.all([currentUser(), getTenantContext(), getSiteSettings()]);
  if (!user) redirect(await tenantPath("/login"));
  if (tenant.isSuperAdmin) redirect("/admin/companies");
  if (!(await verifyPassword("Password", user.passwordHash))) redirect(await tenantPath("/admin"));

  const configuredName = settings.companyName.trim();
  const companyName = configuredName && configuredName !== "Company Name" ? configuredName : tenant.companyCode;

  return <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4"><div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg"><h1 className="text-center"><span className="block text-3xl font-bold">{companyName}</span><span className="mt-1 block text-xl font-semibold text-slate-700">Change Password</span></h1><p className="mb-8 mt-3 text-center text-sm text-slate-500">The default password must be changed before continuing.</p><ChangePasswordForm /></div></main>;
}
