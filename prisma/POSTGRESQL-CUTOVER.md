# Shaoor Construct PostgreSQL cutover

The product will start with an empty `construct` schema. No SQLite application data,
IDs, users, passwords, sessions, OTPs, or uploaded-file records will be migrated.

## Safety boundary

- `prisma/schema.prisma` remains the temporary SQLite runtime schema until the
  application services have been converted to UUIDs, memberships, and Supabase Auth.
- `prisma/schema.postgresql.prisma` is the authoritative target data model.
- The shared `main`, `chat`, `control`, `auth`, and `storage` schemas are out of scope
  for Construct migrations.
- Historical SQLite migrations and `dev.db` are retained only as local references.

## Cutover sequence

1. Add pooled `DATABASE_URL` and migration-only `DIRECT_URL` for the Shaoor AI Tech
   Supabase project without committing credentials.
2. Create only the `construct` schema using the direct connection.
3. Generate and review the initial PostgreSQL migration from the target schema.
4. Apply the migration to a clean development database/schema.
5. Replace local password/session authentication with Supabase Auth.
6. Adapt all services and actions from integer `companyId` values to UUID
   `organizationId` values and membership-based authorization.
7. Move uploads to the `construct-media` Supabase Storage bucket.
8. Seed one new Demo organization and its default site settings through an
   idempotent provisioning service.
9. Run cross-tenant isolation, CRUD, publish, and clean-build tests.
10. Switch the runtime Prisma schema only after all validation passes.

## Storage layout

Use the public-read `construct-media` bucket for website assets. All create, update,
and delete operations remain server-authorized and tenant-scoped. Organize objects as:

`{organization-id}/site`, `{organization-id}/projects`,
`{organization-id}/services`, `{organization-id}/team`, and
`{organization-id}/galleries`.
