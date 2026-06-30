import { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, FileType, Loader2 } from 'lucide-react';
import { Column, exportCsv, exportXlsx, exportPdf } from '../lib/exporters';

interface Props<T> {
  // Base filename (no extension), e.g. "orders".
  baseName: string;
  // Human title used in the PDF header / Excel sheet name, e.g. "Orders".
  title: string;
  columns: Column<T>[];
  rows: T[];
  disabled?: boolean;
}

export default function ExportMenu<T>({ baseName, title, columns, rows, disabled }: Props<T>) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const run = async (fn: () => void | Promise<void>) => {
    setOpen(false);
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Sorry, the export failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const isDisabled = disabled || rows.length === 0 || busy;

  const item =
    'flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isDisabled}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        title={rows.length === 0 ? 'Nothing to export' : 'Export'}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        <span className="hidden sm:inline">Export</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl border shadow-lg py-1 z-20">
          <button className={item} onClick={() => run(() => exportCsv(baseName, columns, rows))}>
            <FileText className="w-4 h-4 text-gray-500" /> CSV (.csv)
          </button>
          <button className={item} onClick={() => run(() => exportXlsx(baseName, title, columns, rows))}>
            <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel (.xlsx)
          </button>
          <button className={item} onClick={() => run(() => exportPdf(baseName, title, columns, rows))}>
            <FileType className="w-4 h-4 text-red-600" /> PDF (.pdf)
          </button>
        </div>
      )}
    </div>
  );
}
