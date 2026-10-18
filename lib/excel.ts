// File: lib/excel.ts
// Excel export. SheetJS is imported dynamically so it is only downloaded on click.
// Codes are written as TEXT cells so Excel never turns 8901248164276 into 8.9E+12.

import type { ScanRecord } from "./types";

export async function exportScansToExcel(scans: ScanRecord[]): Promise<void> {
  const XLSX = await import("xlsx");

  const rows = [...scans].reverse().map((s, i) => ({
    "#": i + 1,
    Code: s.code,
    Format: s.format.replace(/_/g, " "),
    Type: s.parsed.title,
    Details: s.parsed.fields.map((f) => `${f.label}: ${f.value}`).join(" | "),
    Source: s.source,
    "Scanned at": new Date(s.scannedAt).toLocaleString(),
    Notes: s.note,
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 5 }, { wch: 28 }, { wch: 12 }, { wch: 18 },
    { wch: 60 }, { wch: 9 }, { wch: 22 }, { wch: 30 },
  ];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Scans");
  XLSX.writeFile(book, `scans-${new Date().toISOString().slice(0, 10)}.xlsx`);
}