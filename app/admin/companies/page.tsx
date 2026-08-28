import { rawPrisma } from "@/lib/prisma";
import {
  createCompanyAction,
} from "@/lib/actions/company.actions";
import CompanyTable from "@/components/admin/companies/CompanyTable";

export default async function CompaniesPage() {
  const companies = await rawPrisma.company.findMany({
    include: {
      adminUser: { select: { email: true } },
      settings: {
        select: {
          companyName: true,
          logo: true,
          phone: true,
          email: true,
          whatsApp: true,
          facebook: true,
          instagram: true,
          linkedin: true,
          youtube: true,
          twitter: true,
        },
        take: 1,
      },
    },
    orderBy: { id: "asc" },
  });

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold text-slate-900">Companies</h1><p className="mt-2 text-slate-500">Manage website tenants and their administrator accounts.</p></div>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <CompanyTable companies={companies} />
      </div>
      <form action={createCompanyAction} className="grid gap-4 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold md:col-span-2">Add company</h2>
        <label className="text-sm">Company code<input name="code" required pattern="[A-Za-z0-9-]+" className="mt-1 w-full rounded border p-3" placeholder="Universal"/></label>
        <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">The administrator ID will be created as <strong>admin@&lt;companycode&gt;</strong> with the initial password <strong>Password</strong>.</p>
        <button className="rounded bg-slate-900 px-5 py-3 font-medium text-white">Create company</button>
      </form>
    </div>
  );
}
