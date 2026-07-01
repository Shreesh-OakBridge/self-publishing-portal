// Shared admin export helpers — CSV (native), Excel (SheetJS), PDF (jsPDF).
// Libraries are dynamically imported so they don't bloat the main bundle.

export interface Column<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

const cell = <T,>(col: Column<T>, row: T): string => {
  const v = col.value(row);
  return v === null || v === undefined ? '' : String(v);
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const stamp = () => new Date().toISOString().slice(0, 10);

export function exportCsv<T>(baseName: string, columns: Column<T>[], rows: T[]) {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header = columns.map((c) => esc(c.header)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(cell(c, r))).join(',')).join('\n');
  const csv = '﻿' + header + '\n' + body; // BOM for Excel UTF-8
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${baseName}_${stamp()}.csv`);
}

export async function exportXlsx<T>(baseName: string, sheetName: string, columns: Column<T>[], rows: T[]) {
  const XLSX = await import('xlsx');
  const aoa = [columns.map((c) => c.header), ...rows.map((r) => columns.map((c) => cell(c, r)))];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = columns.map((c) => ({ wch: Math.max(12, c.header.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${baseName}_${stamp()}.xlsx`);
}

export async function exportPdf<T>(baseName: string, title: string, columns: Column<T>[], rows: T[]) {
  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const landscape = columns.length > 5;
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait' });

  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString('en-IN')} · ${rows.length} records`, 14, 22);

  autoTable(doc, {
    startY: 26,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => cell(c, r))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [217, 119, 6] }, // amber-600
    alternateRowStyles: { fillColor: [250, 245, 235] },
  });

  doc.save(`${baseName}_${stamp()}.pdf`);
}
