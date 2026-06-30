import { X } from 'lucide-react';

export interface DateRange {
  from: string; // yyyy-mm-dd or ''
  to: string;
}

export const emptyRange: DateRange = { from: '', to: '' };

// Filter rows whose date (via accessor) falls within [from, to] inclusive.
export function filterByRange<T>(rows: T[], range: DateRange, getDate: (r: T) => string | null): T[] {
  if (!range.from && !range.to) return rows;
  const fromT = range.from ? new Date(range.from + 'T00:00:00').getTime() : -Infinity;
  const toT = range.to ? new Date(range.to + 'T23:59:59').getTime() : Infinity;
  return rows.filter((r) => {
    const d = getDate(r);
    if (!d) return false;
    const t = new Date(d).getTime();
    return t >= fromT && t <= toT;
  });
}

export default function DateRangeFilter({
  range,
  onChange,
}: {
  range: DateRange;
  onChange: (r: DateRange) => void;
}) {
  const input =
    'px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-300 outline-none';
  const active = range.from || range.to;

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-semibold text-gray-500 hidden sm:inline">From</label>
      <input
        type="date"
        value={range.from}
        max={range.to || undefined}
        onChange={(e) => onChange({ ...range, from: e.target.value })}
        className={input}
      />
      <label className="text-xs font-semibold text-gray-500 hidden sm:inline">To</label>
      <input
        type="date"
        value={range.to}
        min={range.from || undefined}
        onChange={(e) => onChange({ ...range, to: e.target.value })}
        className={input}
      />
      {active && (
        <button
          onClick={() => onChange(emptyRange)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          title="Clear date filter"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
