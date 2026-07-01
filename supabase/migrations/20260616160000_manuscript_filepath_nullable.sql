/*
  # Allow portal-written manuscripts (no uploaded file)

  Manuscripts created by writing directly in the in-portal editor have no
  uploaded file, so file_path must be nullable.
*/
ALTER TABLE manuscripts ALTER COLUMN file_path DROP NOT NULL;
