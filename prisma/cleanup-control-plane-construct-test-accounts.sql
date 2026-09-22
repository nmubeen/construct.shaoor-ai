-- Cleans up the SHARED `control` schema's copy of Construct's now-deleted
-- test organizations (construct.organizations is already empty — see
-- cleanup-trial-organizations.sql). shaoor-ai.com's admin dashboard reads
-- `control.accounts`/`control.subscriptions`/`control.product_instances`
-- directly and Construct only ever pushes into them (see
-- lib/control-sync.ts) — nothing deletes from there when an org is removed
-- on Construct's side, which is why these 7 rows were still showing up.
--
-- SAFE BY CONSTRUCTION, not just by care: control.accounts has NO unique
-- constraint on billing_email — every product creates its OWN, separate
-- account row per signup (confirmed live: mubeenn@hotmail.com has three
-- entirely distinct control.accounts rows, one each for Construct, Chat
-- and TuiTrak, correlated only by sharing the same Supabase identity, with
-- no FK between them). The account set below is captured ONCE, up front,
-- as exactly "accounts with a subscription whose product is
-- SHAOOR_CONSTRUCT" — every later statement deletes from that same fixed
-- list, never re-derived after earlier deletes have already run, so it
-- cannot drift onto a sibling product's data.
--
-- After this, the same email can sign up to Construct again as a brand
-- new account (no leftover account_members/subscription/product_instance
-- row) — its Pets/TuiTrak/Chat accounts are untouched either way.
--
-- Usage: run STEP 1 alone and read it, then run STEP 2 through COMMIT (or
-- ROLLBACK instead, if anything before COMMIT looks wrong).

-- ============================================================
-- STEP 1 — PREVIEW ONLY. Run this first and read the result.
-- ============================================================
SELECT a.id AS account_id, a.name AS account_name, a.billing_email, a.slug,
       s.id AS subscription_id, s.status AS subscription_status,
       pi.id AS product_instance_id, pi.tenant_organization_id
FROM control.accounts a
JOIN control.subscriptions s ON s.account_id = a.id
JOIN control.products p ON p.id = s.product_id
LEFT JOIN control.product_instances pi ON pi.subscription_id = s.id
WHERE p.code = 'SHAOOR_CONSTRUCT'
ORDER BY a.billing_email;

-- ============================================================
-- STEP 2 — Only after checking STEP 1's output.
-- ============================================================
BEGIN;

-- Fixed snapshot of exactly which accounts/subscriptions are in scope,
-- taken before anything is deleted. Every DELETE below reads from this,
-- never from a live re-query of control.subscriptions/accounts.
CREATE TEMP TABLE _construct_test_accounts ON COMMIT DROP AS
SELECT a.id AS account_id, s.id AS subscription_id
FROM control.accounts a
JOIN control.subscriptions s ON s.account_id = a.id
JOIN control.products p ON p.id = s.product_id
WHERE p.code = 'SHAOOR_CONSTRUCT';

-- product_instances.account_id and subscriptions.account_id are both
-- ON DELETE RESTRICT from accounts, so both must go before the accounts
-- rows themselves. account_members, subscription_notifications and
-- subscription_entitlement_overrides all cascade automatically once their
-- parent subscription/account is deleted; control_audit_logs.account_id
-- is ON DELETE SET NULL, so those log rows survive with the link cleared
-- rather than being deleted (harmless — just historical log entries).
DELETE FROM control.product_instances
WHERE subscription_id IN (SELECT subscription_id FROM _construct_test_accounts);

DELETE FROM control.usage_events
WHERE account_id IN (SELECT account_id FROM _construct_test_accounts);

DELETE FROM control.subscriptions
WHERE id IN (SELECT subscription_id FROM _construct_test_accounts);

DELETE FROM control.accounts
WHERE id IN (SELECT account_id FROM _construct_test_accounts);

-- Review the row counts Postgres reports for the four statements above —
-- expect 7 for product_instances/subscriptions/accounts, 0 for
-- usage_events. Then either:
COMMIT;
-- or, if anything looks wrong:
-- ROLLBACK;
