CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "recordId" TEXT,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AuditLog_module_idx" ON "AuditLog"("module");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
