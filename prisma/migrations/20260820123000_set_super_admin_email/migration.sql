UPDATE "User"
SET "email" = 'admin@shaoor-build.com', "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = (
  SELECT "adminUserId" FROM "Company" WHERE "id" = 0
);
