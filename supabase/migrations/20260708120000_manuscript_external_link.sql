/*
  # Manuscript external link (large-file fallback)

  Manuscript uploads are capped at 50 MB (up from 25 MB). If an author's file
  is larger than that, the UI lets them paste a shareable download link
  (Google Drive, Dropbox, WeTransfer, etc.) instead of uploading — this column
  stores that link. A manuscript row now has either file_path (uploaded) or
  external_url (linked), or neither yet.

  Idempotent — safe to re-run.
*/

ALTER TABLE manuscripts ADD COLUMN IF NOT EXISTS external_url text;
