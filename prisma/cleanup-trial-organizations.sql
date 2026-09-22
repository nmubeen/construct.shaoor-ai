-- Deletes every organization currently on the TRIAL plan, and everything
-- that belongs to it (services, projects, media, enquiry questions,
-- memberships, domains, SEO settings, etc.) via ON DELETE CASCADE — every
-- one of the 23 foreign keys referencing construct.organizations is
-- CASCADE (confirmed against the live database's constraint catalog, not
-- just the migration files). Nothing outside the `construct` schema, and
-- nothing on any other plan, is touched.
--
-- As of writing, this matches exactly two organizations:
--   1817 Builders  (1817builders)   — owner zamaanforever@gmail.com
--   2Yards Studios (mubeenn-fxmlb4) — owner mubeenn@hotmail.com
-- Neither is the account this cleanup was requested from — double-check
-- the preview below before committing if that matters to you.
--
-- Usage: run in the Supabase SQL editor (or `psql "$DIRECT_URL" -f
-- prisma/cleanup-trial-organizations.sql`) as separate steps:
--   1. Run STEP 1 alone. Read the output.
--   2. If it's exactly who you expect to delete, run STEP 2 through COMMIT.
--   3. If anything looks wrong at any point before COMMIT, run ROLLBACK instead.

-- ============================================================
-- STEP 1 — PREVIEW ONLY. Run this first and read the result.
-- ============================================================
SELECT o.id, o.name, o.slug, o.status, o.plan_code, o.trial_ends_at,
       u.email AS owner_email,
       (SELECT count(*) FROM construct.services s WHERE s.organization_id = o.id) AS services,
       (SELECT count(*) FROM construct.projects p WHERE p.organization_id = o.id) AS projects,
       (SELECT count(*) FROM construct.service_enquiry_questions q WHERE q.organization_id = o.id) AS enquiry_questions,
       (SELECT count(*) FROM construct.contact_messages m WHERE m.organization_id = o.id) AS messages
FROM construct.organizations o
LEFT JOIN construct.memberships mem ON mem.organization_id = o.id AND mem.role = 'OWNER'
LEFT JOIN construct.users u ON u.id = mem.user_id
WHERE o.plan_code = 'TRIAL'
ORDER BY o.created_at;

-- ============================================================
-- STEP 2 — Only after checking STEP 1's output.
-- ============================================================
BEGIN;

-- No FK covers this table, so an org delete leaves its rows orphaned
-- (harmless — it's just a reconciliation log — but cleaned up for
-- correctness). Currently 0 rows.
DELETE FROM construct.control_sync_failures
WHERE organization_id IN (SELECT id FROM construct.organizations WHERE plan_code = 'TRIAL');

DELETE FROM construct.organizations
WHERE plan_code = 'TRIAL';

-- Review the row counts Postgres reports for the two statements above.
-- Then either:
COMMIT;
-- or, if anything looks wrong:
-- ROLLBACK;
