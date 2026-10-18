// File: components/HistoryList.tsx
"use client";

import { useState } from "react";
import { Download, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { exportScansToExcel } from "@/lib/excel";
import type { ScanRecord } from "@/lib/types";

interface Props {
  scans: ScanRecord[];
  onNote: (id: string, note: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function HistoryList({ scans, onNote, onRemove, onClear }: Props) {
  const [exporting, setExporting] = useState(false);

  async function exportExcel() {
    setExporting(true);
    try {
      await exportScansToExcel(scans);
    } finally {
      setExporting(false);
    }
  }

  function clearAll() {
    if (window.confirm("Delete all saved scans? This cannot be undone.")) onClear();
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-semibold">Scan history</h2>
        <div className="flex gap-2">
          <Button onClick={exportExcel} disabled={!scans.length || exporting}>
            {exporting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            Export Excel
          </Button>
          <Button variant="danger" onClick={clearAll} disabled={!scans.length}>
            <Trash2 className="size-4" aria-hidden /> Clear
          </Button>
        </div>
      </div>

      {scans.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Your scans are saved on this device and will be listed here.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {scans.map((s) => (
            <li key={s.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-all font-mono text-sm font-semibold">{s.code}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {s.parsed.title} · {s.format.replace(/_/g, " ")} · {s.source} ·{" "}
                    {new Date(s.scannedAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => onRemove(s.id)}
                  aria-label={`Delete scan ${s.code}`}
                  className="min-h-9 shrink-0 px-2"
                >
                  <X className="size-4" aria-hidden />
                </Button>
              </div>
              <input
                value={s.note}
                onChange={(e) => onNote(s.id, e.target.value)}
                placeholder="Add a name or note"
                aria-label={`Note for ${s.code}`}
                className="mt-3 min-h-10 w-full rounded-lg border-0 bg-slate-50 px-3 text-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:outline-none dark:bg-slate-800 dark:ring-slate-700"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}