// Helpers for resolving a stored proof `file_url` to something openable.
//
// A proof's file_url is one of:
//   • a bare object path we stored on upload, e.g. "<orderId>/1699-cover.pdf"
//   • a legacy Supabase public/sign storage URL (…/storage/v1/object/…/proofs/<path>)
//   • an external link the team pasted (https://…)
//
// The proofs bucket is now PRIVATE, so storage-backed files must be opened via a
// short-lived signed URL. `proofStoragePath` returns the object path to sign, or
// null when the value is an external link that should be used as-is.

export function proofStoragePath(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null;
  // Supabase storage URL (legacy public, signed, or authenticated) → take the
  // path segment after "/proofs/".
  const m = fileUrl.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/proofs\/([^?]+)/);
  if (m) return decodeURIComponent(m[1]);
  // Any other absolute URL is an external link — not our storage.
  if (/^https?:\/\//i.test(fileUrl)) return null;
  // Otherwise treat it as a bare object path we stored ourselves.
  return fileUrl.replace(/^\/+/, '').replace(/^proofs\//, '');
}

// True when the value is an external link (open directly, no signing needed).
export function isExternalProofUrl(fileUrl: string | null | undefined): boolean {
  return !!fileUrl && /^https?:\/\//i.test(fileUrl) && proofStoragePath(fileUrl) === null;
}
