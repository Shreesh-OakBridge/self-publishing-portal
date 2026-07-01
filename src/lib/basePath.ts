// The app is served under a base path (e.g. /cursive). All internal navigation
// goes through these helpers so links stay within the base. import.meta.env.
// BASE_URL is set from Vite's `base` config ("/cursive/").

export const BASE = (import.meta.env.BASE_URL || '/').replace(/\/+$/, ''); // "/cursive" or ""

// Prefix an absolute in-app path with the base (idempotent). Leaves external
// URLs, mailto:, tel:, and relative/hash paths untouched.
export function withBase(path: string): string {
  if (!path || !path.startsWith('/')) return path;
  if (BASE && (path === BASE || path.startsWith(BASE + '/'))) return path;
  return BASE + path;
}

// Full-page navigate to an in-app path, base-aware.
export function go(path: string): void {
  window.location.href = withBase(path);
}

// Strip the base off the current pathname so the router can match "/login" etc.
export function stripBase(pathname: string): string {
  const p = pathname.replace(/\/+$/, '');
  if (!BASE) return p;
  if (p === BASE) return '';
  if (p.startsWith(BASE + '/')) return p.slice(BASE.length);
  return p;
}
