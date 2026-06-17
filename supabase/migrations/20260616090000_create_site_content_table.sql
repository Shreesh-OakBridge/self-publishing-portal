/*
  # Create Site Content Table (CMS)

  1. New Tables
    - `site_content` - Stores editable home-page content as section overrides.
      - `key` (text, primary key) - Section identifier (e.g. 'hero', 'pricing', 'footer')
      - `value` (jsonb) - The section's content object
      - `updated_at` (timestamptz) - Last edit time

  2. Security
    - Enable RLS on `site_content`
    - Public (anon) can SELECT, so the marketing site can render content
    - Only authenticated (admin) users can INSERT / UPDATE / DELETE content

  Notes
    - The application ships with full default content in code. This table only
      stores overrides for sections an admin has edited, so the site renders
      correctly even when the table is empty.
*/

CREATE TABLE IF NOT EXISTS site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site content"
  ON site_content
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert site content"
  ON site_content
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update site content"
  ON site_content
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete site content"
  ON site_content
  FOR DELETE
  TO authenticated
  USING (true);
