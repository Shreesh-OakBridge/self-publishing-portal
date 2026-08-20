// A nav/footer link's URL can be one of three kinds.
export type LinkKind = 'external' | 'section' | 'route';

export function linkKind(url: string): LinkKind {
  if (/^https?:\/\//i.test(url)) return 'external';
  if (url.startsWith('#')) return 'section';
  return 'route';
}
