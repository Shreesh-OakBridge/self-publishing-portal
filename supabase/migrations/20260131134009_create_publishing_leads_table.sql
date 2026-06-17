/*
  # Create Publishing Leads Table

  1. New Tables
    - `publishing_leads`
      - `id` (uuid, primary key) - Unique identifier for each lead
      - `full_name` (text) - Full name of the interested party
      - `email` (text) - Email address for contact
      - `phone` (text, optional) - Phone number
      - `manuscript_title` (text, optional) - Working title of the manuscript
      - `genre` (text, optional) - Genre of the book
      - `manuscript_status` (text) - Status of manuscript (draft, completed, etc.)
      - `preferred_plan` (text, optional) - Which plan they're interested in
      - `message` (text, optional) - Additional notes or questions
      - `created_at` (timestamptz) - When the lead was submitted
      
  2. Security
    - Enable RLS on `publishing_leads` table
    - Add policy for inserting leads (public can submit)
    - Add policy for authenticated admin users to view leads
*/

CREATE TABLE IF NOT EXISTS publishing_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  manuscript_title text,
  genre text,
  manuscript_status text NOT NULL,
  preferred_plan text,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE publishing_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a publishing lead"
  ON publishing_leads
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all leads"
  ON publishing_leads
  FOR SELECT
  TO authenticated
  USING (true);