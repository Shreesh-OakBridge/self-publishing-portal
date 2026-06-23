import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { defaultContent, SiteContent } from './defaults';

// Deep-merge an override object over a base, key by key. Objects merge
// recursively; arrays and primitives in the override replace the base.
export function deepMerge<T>(base: T, override: unknown): T {
  if (
    override == null ||
    typeof override !== 'object' ||
    Array.isArray(override) ||
    typeof base !== 'object' ||
    base == null ||
    Array.isArray(base)
  ) {
    return (override == null ? base : (override as T));
  }
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    const baseValue = (base as Record<string, unknown>)[key];
    result[key] = deepMerge(baseValue, value);
  }
  return result as T;
}

interface ContentContextValue {
  content: SiteContent;
  loading: boolean;
}

const ContentContext = createContext<ContentContextValue>({
  content: defaultContent,
  loading: true,
});

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase.from('site_content').select('key, value');
        if (error) throw error;
        if (active && data) {
          let merged: SiteContent = defaultContent;
          for (const row of data as { key: string; value: unknown }[]) {
            if (row.key in merged) {
              merged = {
                ...merged,
                [row.key]: deepMerge(
                  (merged as unknown as Record<string, unknown>)[row.key],
                  row.value
                ),
              };
            }
          }
          setContent(merged);
        }
      } catch (err) {
        // Fall back to defaults silently — the site still renders fully.
        console.error('Could not load site content, using defaults:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <ContentContext.Provider value={{ content, loading }}>{children}</ContentContext.Provider>
  );
}

export function useContent(): SiteContent {
  return useContext(ContentContext).content;
}
