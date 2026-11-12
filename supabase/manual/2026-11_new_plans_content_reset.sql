/*
  One-off: make the LIVE site pick up the new plans / content from code.

  Why: Admin → Site Content saves overrides in `site_content`. Lists in an
  override REPLACE the code defaults, so an old saved `pricing` row (Starter
  ₹24,999 / Essential / 30–60% royalty) would hide the new plans, and old
  `journeys` / `faq` / `testimonials` rows would hide the new author paths,
  royalty FAQ and the removal of the template testimonials.

  Safe: everything is backed up first. To undo for one key:
    UPDATE site_content s SET value = b.value FROM site_content_backup_20261112 b
    WHERE s.key = b.key AND s.key = 'faq';
  (or INSERT … SELECT from the backup if the row was deleted).

  Run in Supabase → SQL Editor. Run step 1 alone first if you want to see
  what is currently overridden.
*/

-- 1) What is overridden right now?
SELECT key, updated_at, left(value::text, 120) AS preview
FROM site_content
ORDER BY key;

-- 2) Backup (idempotent)
CREATE TABLE IF NOT EXISTS site_content_backup_20261112 AS
  SELECT * FROM site_content;
-- Keep the backup private (RLS on, no policies = no API access).
ALTER TABLE site_content_backup_20261112 ENABLE ROW LEVEL SECURITY;

-- 3) Drop stale overrides so the new code defaults show.
--    Re-edit any of these in Admin → Site Content afterwards if needed.
DELETE FROM site_content
WHERE key IN ('pricing', 'testimonials', 'confidenceBar', 'journeys', 'faq', 'homeLayout');

-- 4) Footer: one legal name + WhatsApp number (keeps your other footer edits).
UPDATE site_content
SET value = value || '{"copyrightName": "OakBridge Publishing", "whatsapp": "918800337299"}'::jsonb,
    updated_at = now()
WHERE key = 'footer';

-- 5) Navigation: turn on the floating WhatsApp button (keeps your menu edits).
UPDATE site_content
SET value = value || '{"showWhatsApp": true}'::jsonb,
    updated_at = now()
WHERE key = 'navigation';
