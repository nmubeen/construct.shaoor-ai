UPDATE "User"
SET "email" = 'superadmin',
    "passwordHash" = '$2b$12$sGMcvc/lEl12zHqj7UWewu8U3ybI.YYUVIgOYK.WTF8NAQzQB270y',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = (
  SELECT "adminUserId" FROM "Company" WHERE "id" = 0
);
