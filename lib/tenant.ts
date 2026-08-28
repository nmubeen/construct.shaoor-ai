import "server-only";

import { headers } from "next/headers";

export const SUPER_ADMIN_COMPANY_ID = 0;

export async function getTenantContext() {
  const requestHeaders = await headers();
  const companyId = Number(requestHeaders.get("x-company-id") ?? 0);
  const companyCode = requestHeaders.get("x-company-code") ?? "Shaoor-Construct";

  return {
    companyId: Number.isSafeInteger(companyId) && companyId >= 0 ? companyId : 0,
    companyCode,
    isSuperAdmin: companyId === SUPER_ADMIN_COMPANY_ID,
    urlPrefix: companyId === SUPER_ADMIN_COMPANY_ID ? "" : `/${companyCode}`,
  };
}

export async function tenantPath(path: string) {
  const { urlPrefix } = await getTenantContext();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${urlPrefix}${normalized}`;
}
