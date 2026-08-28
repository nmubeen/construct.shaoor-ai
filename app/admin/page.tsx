import { redirect } from "next/navigation";
import { tenantPath } from "@/lib/tenant";

export default async function AdminPage() {
  redirect(await tenantPath("/admin/dashboard"));
}
