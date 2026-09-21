-- Tenant-configurable enquiry questions, one ordered list per service.
-- Options for single_select / multi_select live in a JSONB string array
-- (e.g. ["Residential", "Commercial"]) rather than a child table — same
-- "keep V1 simple" trade-off as sub_services. question_type is plain TEXT
-- (validated in the server action) so new types need no enum migration.
CREATE TABLE construct.service_enquiry_questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES construct.organizations(id) ON DELETE CASCADE,
  service_id      uuid NOT NULL REFERENCES construct.services(id) ON DELETE CASCADE,
  question_text   text NOT NULL,
  question_type   text NOT NULL,
  options         jsonb,
  is_required     boolean NOT NULL DEFAULT false,
  is_active       boolean NOT NULL DEFAULT true,
  display_order   integer NOT NULL DEFAULT 0,
  created_at      timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT service_enquiry_questions_type_check CHECK (
    question_type IN ('short_text', 'long_text', 'number', 'single_select', 'multi_select', 'yes_no', 'date')
  )
);

CREATE INDEX service_enquiry_questions_org_service_order_idx
  ON construct.service_enquiry_questions (organization_id, service_id, display_order);

-- Access to this table is server-only: every read/write goes through
-- Prisma (a server-side connection) and is scoped by organization_id —
-- the public form via the host-resolved organization, the dashboard via
-- the signed-in membership. RLS with NO policies additionally locks the
-- table against Supabase's anon/authenticated API roles (the publishable
-- key ships to browsers), so nobody can read or edit it through the
-- Data API. The Prisma role owns the table and is unaffected.
ALTER TABLE construct.service_enquiry_questions ENABLE ROW LEVEL SECURITY;

-- Submitted enquiries reuse construct.contact_messages (and its existing
-- status model) instead of a second enquiry table. The service *title* is
-- already snapshotted in project_interest, so only the linkage and the new
-- structured fields are added. service_id is SET NULL on delete so a
-- removed service never deletes historical enquiries.
ALTER TABLE construct.contact_messages
  ADD COLUMN service_id                uuid REFERENCES construct.services(id) ON DELETE SET NULL,
  ADD COLUMN sub_service               text,
  ADD COLUMN project_location          text,
  ADD COLUMN preferred_contact_method  text,
  -- [{ questionId, question, type, answer }] — question text is copied at
  -- submit time so later edits/deletes of the question don't rewrite history.
  ADD COLUMN answers                   jsonb,
  -- Additional Requirements is optional now; existing rows keep their text.
  ALTER COLUMN message SET DEFAULT '';

CREATE INDEX contact_messages_organization_id_service_id_idx
  ON construct.contact_messages (organization_id, service_id);
