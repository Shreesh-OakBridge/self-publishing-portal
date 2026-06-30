import { Search, X, ArrowDown, ArrowUp } from 'lucide-react';
import type { Column } from '../lib/exporters';
import type { SortState } from '../lib/adminFilter';

export function SearchBox({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-8 py-2 w-52 sm:w-64 border border-gray-300 rounded-lg text-sm focus:border-amber-500 outline-none"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function SortControl<T>({
  columns,
  sort,
  onChange,
}: {
  columns: Column<T>[];
  sort: SortState;
  onChange: (s: SortState) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <select
        value={sort.key}
        onChange={(e) => onChange({ key: e.target.value, dir: sort.dir })}
        className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:border-amber-500 outline-none max-w-[11rem]"
      >
        <option value="">Sort: default</option>
        {columns.map((c) => (
          <option key={c.header} value={c.header}>
            Sort: {c.header}
          </option>
        ))}
      </select>
      <button
        onClick={() => onChange({ key: sort.key, dir: sort.dir === 'asc' ? 'desc' : 'asc' })}
        disabled={!sort.key}
        title={sort.dir === 'asc' ? 'Ascending' : 'Descending'}
        aria-label="Toggle sort direction"
        className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40"
      >
        {sort.dir === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
      </button>
    </div>
  );
}
