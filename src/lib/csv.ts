// Tiny CSV writer. Excel-friendly: UTF-8 BOM (so Sinhala/Tamil names show
// correctly) and CRLF line endings.

type Cell = string | number | null | undefined;

function escapeCell(value: Cell): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  // Stop spreadsheet "formula injection": a cell starting with = + - @ would
  // be run as a formula by Excel. Prefix it with ' so it stays plain text.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function toCsv(header: string[], rows: Cell[][]): string {
  const lines = [header, ...rows].map((row) => row.map(escapeCell).join(','));
  return '﻿' + lines.join('\r\n') + '\r\n';
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
