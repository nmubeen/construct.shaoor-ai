"use server";

import { prisma } from "@/lib/prisma";
import { ensureAuditLogTableIsCompatible } from "@/lib/actions/audit-repair";

interface LogActivityInput {
  module: string;
  action: string;
  recordId?: string | null;
  title: string;
  details?: string | null;
}

interface GetAuditLogsOptions {
  module?: string;
  query?: string;
  page?: number;
  pageSize?: number;
}

function auditLogDelegate() {
  const delegate = (prisma as unknown as { auditLog?: typeof prisma.auditLog }).auditLog;

  if (!delegate) {
    throw new Error("Prisma client is out of date. Run `npx prisma generate` and restart the server.");
  }

  return delegate;
}

function normalizedPage(value?: number) {
  if (!value || Number.isNaN(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function normalizedPageSize(value?: number) {
  if (!value || Number.isNaN(value) || value < 1) {
    return 20;
  }

  return Math.min(Math.floor(value), 100);
}

export async function logActivity({
  module,
  action,
  recordId,
  title,
  details,
}: LogActivityInput) {
  await ensureAuditLogTableIsCompatible();

  await auditLogDelegate().create({
    data: {
      module,
      action,
      recordId: recordId ?? null,
      title,
      details: details ?? null,
    },
  });
}

export async function getAuditLogs(options: GetAuditLogsOptions = {}) {
  await ensureAuditLogTableIsCompatible();

  const page = normalizedPage(options.page);
  const pageSize = normalizedPageSize(options.pageSize);
  const query = (options.query ?? "").trim();
  const moduleFilter = (options.module ?? "").trim();

  const where = {
    ...(moduleFilter && moduleFilter !== "ALL" ? { module: moduleFilter } : {}),
    ...(query
      ? {
          OR: [
            {
              title: {
                contains: query,
              },
            },
            {
              details: {
                contains: query,
              },
            },
          ],
        }
      : {}),
  };

  const auditLog = auditLogDelegate();

  const [total, items] = await Promise.all([
    auditLog.count({ where }),
    auditLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function deleteOldLogs(days = 180) {
  await ensureAuditLogTableIsCompatible();

  const parsedDays = Number(days);
  const daysToKeep = Number.isNaN(parsedDays) || parsedDays < 1 ? 180 : Math.floor(parsedDays);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await auditLogDelegate().deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return {
    deletedCount: result.count,
  };
}
