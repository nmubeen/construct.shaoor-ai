-- Sample enquiry questions for ONE tenant's "Building Construction" service,
-- for testing the service enquiry form. Not run automatically — every tenant
-- starts with no questions and can edit or delete all of these in
-- Dashboard > Services > Configure Enquiry Form.
--
-- Usage (after applying 20260921000000_service_enquiry_questions):
--   psql "$DIRECT_URL" -v org_slug=your-tenant-slug -f prisma/seed-building-construction-enquiry-questions.sql
--
-- Idempotent: does nothing if that service already has any question.
INSERT INTO construct.service_enquiry_questions
  (organization_id, service_id, question_text, question_type, options, is_required, display_order)
SELECT s.organization_id, s.id, q.question_text, q.question_type, q.options::jsonb, q.is_required, q.display_order
FROM construct.services s
JOIN construct.organizations o ON o.id = s.organization_id
CROSS JOIN (VALUES
  (0, 'What type of construction are you planning?', 'single_select',
      '["Independent House / Villa", "Apartment / Residential Building", "Commercial Building", "Office", "Warehouse / Industrial", "Other"]', true),
  (1, 'Approximate plot / site area (sq ft)?', 'number', NULL, false),
  (2, 'How many floors are planned?', 'number', NULL, false),
  (3, 'Do you already have architectural drawings?', 'yes_no', NULL, false),
  (4, 'When would you like construction to start?', 'single_select',
      '["Immediately", "Within 1-3 months", "Within 3-6 months", "More than 6 months from now", "Not sure yet"]', false)
) AS q(display_order, question_text, question_type, options, is_required)
WHERE o.slug = :'org_slug'
  AND s.slug = 'building-construction'
  AND NOT EXISTS (SELECT 1 FROM construct.service_enquiry_questions e WHERE e.service_id = s.id);
