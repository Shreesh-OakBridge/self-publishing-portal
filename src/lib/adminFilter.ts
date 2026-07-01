import type { Column } from './exporters';

// Reusable free-text search + sort for admin tables. Both work off the same
// `Column[]` arrays the panels already define for CSV/Excel export, so adding
// them to a panel is just: state + run filterBySearch/sortRows + the controls.

const cellText = <T,>(col: Column<T>, row: T) => String(col.value(row) ?? '');

// Case-insensitive, all-terms-must-match search across every column value,
// plus any extra hidden fields (e.g. IDs) supplied per row.
export function filterBySearch<T>(
  rows: T[],
  columns: Column<T>[],
  query: string,
  extra?: (row: T) => string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  const terms = q.split(/\s+/);
  return rows.filter((row) => {
    const hay = `${columns.map((c) => cellText(c, row)).join(' ')} ${extra ? extra(row) : ''}`.toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

export interface SortState {
  key: string; // column header, '' = default order
  dir: 'asc' | 'desc';
}
export const noSort: SortState = { key: '', dir: 'asc' };

export function sortRows<T>(rows: T[], columns: Column<T>[], sort: SortState): T[] {
  if (!sort.key) return rows;
  const col = columns.find((c) => c.header === sort.key);
  if (!col) return rows;
  const sign = sort.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = col.value(a);
    const bv = col.value(b);
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sign;
    return String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true }) * sign;
  });
}
