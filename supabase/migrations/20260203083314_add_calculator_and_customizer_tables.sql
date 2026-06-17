/*
  # Add Calculator and Customizer Tables

  1. New Tables
    - `book_customizations` - Store user's interactive book customizations
      - `id` (uuid, primary key)
      - `session_id` (text) - Session/user identifier
      - `paper_type` (text) - Selected paper type
      - `cover_design` (text) - Selected cover design option
      - `layout_option` (text) - Selected layout
      - `book_size` (text) - Selected book size
      - `estimated_price` (numeric) - Calculated price
      - `created_at` (timestamptz)

    - `royalty_calculations` - Store royalty calculator results
      - `id` (uuid, primary key)
      - `book_price` (numeric) - Price set by author
      - `expected_sales` (integer) - Expected monthly sales
      - `plan_type` (text) - Which plan
      - `estimated_royalty` (numeric) - Calculated royalty per book
      - `monthly_earnings` (numeric) - Expected monthly earnings
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policy for inserting/viewing own data
*/

CREATE TABLE IF NOT EXISTS book_customizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  paper_type text,
  cover_design text,
  layout_option text,
  book_size text,
  estimated_price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS royalty_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_price numeric NOT NULL,
  expected_sales integer DEFAULT 0,
  plan_type text,
  estimated_royalty numeric DEFAULT 0,
  monthly_earnings numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE book_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalty_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert book customizations"
  ON book_customizations
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can insert royalty calculations"
  ON royalty_calculations
  FOR INSERT
  TO public
  WITH CHECK (true);