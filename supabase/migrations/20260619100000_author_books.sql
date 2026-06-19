/*
  # Author books (publishing dashboard)

  Per-author published/in-progress titles powering the logged-in author
  dashboard: script status, publishing date, copies sold, and the figures used
  to compute royalty earnings (book_price × royalty_rate%).

  Data is entered manually by admins. Authors can read their own books only.
*/

CREATE TABLE IF NOT EXISTS author_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'submitted',
  publish_date date,
  copies_sold integer NOT NULL DEFAULT 0,
  book_price numeric NOT NULL DEFAULT 0,
  royalty_rate numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE author_books ENABLE ROW LEVEL SECURITY;

-- Authors may read their own books; admins manage everything.
DROP POLICY IF EXISTS "Authors read own books" ON author_books;
CREATE POLICY "Authors read own books"
  ON author_books FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins read all books" ON author_books;
CREATE POLICY "Admins read all books"
  ON author_books FOR SELECT TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "Admins insert books" ON author_books;
CREATE POLICY "Admins insert books"
  ON author_books FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admins update books" ON author_books;
CREATE POLICY "Admins update books"
  ON author_books FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admins delete books" ON author_books;
CREATE POLICY "Admins delete books"
  ON author_books FOR DELETE TO authenticated USING (is_admin());
