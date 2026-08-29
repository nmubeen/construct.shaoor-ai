"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { FaCheck, FaPen, FaXmark } from "react-icons/fa6";
import {
  resetCompanyAdminPasswordAction,
  setCompanyStatusAction,
  updateCompanyAction,
} from "@/lib/actions/company.actions";

type CompanyRow = {
  id: number;
  code: string;
  otp: string;
  status: "ACTIVE" | "INACTIVE";
  adminUser: { email: string } | null;
  settings: Array<{
    companyName: string;
    logo: string | null;
    email: string;
  }>;
};

function PasswordReset({ companyId, onOtpGenerated }: { companyId: number; onOtpGenerated: (otp: string) => void }) {
  const [state, action, pending] = useActionState(resetCompanyAdminPasswordAction, {});

  useEffect(() => {
    if (state.otp) onOtpGenerated(state.otp);
  }, [state.otp, onOtpGenerated]);

  return (
    <form action={action} onSubmit={(event) => {
        if (!window.confirm('Reset this administrator password to "Password"?')) event.preventDefault();
      }}>
      <input type="hidden" name="id" value={companyId} />
      <button disabled={pending} className="whitespace-nowrap rounded border border-amber-300 bg-amber-50 px-3 py-1.5 text-amber-800 disabled:opacity-50">
        {pending ? "Resetting…" : "Reset Password"}
      </button>
    </form>
  );
}

function CompanyActions({ company, editing, setEditing, onOtpGenerated }: { company: CompanyRow; editing: boolean; setEditing: (value: boolean) => void; onOtpGenerated: (otp: string) => void }) {
  if (editing) {
    const saveCompany = async (formData: FormData) => {
      await updateCompanyAction(formData);
      setEditing(false);
    };

    return (
      <form
        id={`edit-company-${company.id}`}
        action={saveCompany}
        className="flex items-center gap-2"
        onSubmit={(event) => {
          if (!window.confirm("Save the updated company code and administrator user ID?")) event.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={company.id} />
        <button className="rounded bg-slate-900 px-3 py-2 text-white">Save</button>
        <button type="button" onClick={() => setEditing(false)} className="rounded border px-3 py-2">Cancel</button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setEditing(true)} title="Edit company" aria-label="Edit company" className="flex h-8 w-8 items-center justify-center rounded border text-slate-600 hover:bg-slate-50"><FaPen /></button>
      <PasswordReset companyId={company.id} onOtpGenerated={onOtpGenerated} />
      {company.id !== 0 && <form action={setCompanyStatusAction}><input type="hidden" name="id" value={company.id} /><input type="hidden" name="status" value={company.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"} /><button className="whitespace-nowrap rounded border px-3 py-1.5">{company.status === "ACTIVE" ? "Deactivate" : "Activate"}</button></form>}
    </div>
  );
}

function CompanyRecord({ company }: { company: CompanyRow }) {
  const [editing, setEditing] = useState(false);
  const [displayedOtp, setDisplayedOtp] = useState(company.otp);
  const settings = company.settings[0];
  const websitePath = company.id === 0 ? "/" : `/${company.code}`;
  const editFormId = `edit-company-${company.id}`;

  return <tr className="border-t align-middle">
    <td className="p-3">{settings?.logo ? <Image src={settings.logo} alt={`${settings.companyName} logo`} width={44} height={44} className="h-11 w-11 rounded border object-contain" unoptimized /> : <div className="flex h-11 w-11 items-center justify-center rounded border bg-slate-50 text-[10px] text-slate-400">No logo</div>}</td>
    <td className="p-3"><span className="text-lg font-bold text-slate-900">{settings?.companyName || "—"}</span></td>
    <td className="p-3 font-medium">{editing ? <input form={editFormId} name="code" required pattern="[A-Za-z0-9-]+" defaultValue={company.code} aria-label="Company code" className="w-32 rounded border p-2" /> : company.code}</td>
    <td className="p-3">{editing ? <input form={editFormId} name="email" required defaultValue={company.adminUser?.email ?? ""} aria-label="Admin user" className="w-44 rounded border p-2" /> : company.adminUser?.email ?? "—"}</td>
    <td className="p-3">{settings?.email || "—"}</td>
    <td className="p-3"><a href={websitePath} className="text-blue-700 hover:underline">{websitePath}</a></td>
    <td className="p-3">{company.status === "ACTIVE" ? <span title="Active" aria-label="Active" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600"><FaCheck /><span className="sr-only">Active</span></span> : <span title="Inactive" aria-label="Inactive" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600"><FaXmark /><span className="sr-only">Inactive</span></span>}</td>
    <td className="p-3 font-mono font-semibold">{displayedOtp}</td>
    <td className="p-3"><CompanyActions company={company} editing={editing} setEditing={setEditing} onOtpGenerated={setDisplayedOtp} /></td>
  </tr>;
}

export default function CompanyTable({ companies }: { companies: CompanyRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-max w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600"><tr><th className="p-3">Logo</th><th className="p-3">Company Name</th><th className="p-3">Company Code</th><th className="p-3">Admin User</th><th className="p-3">Email</th><th className="p-3">Website</th><th className="p-3">Status</th><th className="p-3">OTP</th><th className="p-3">Actions</th></tr></thead>
        <tbody>{companies.map((company) => <CompanyRecord key={company.id} company={company} />)}</tbody>
      </table>
    </div>
  );
}
