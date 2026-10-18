// File: components/Header.tsx
import { ScanLine } from "lucide-react";

export function Header({ count }: { count: number }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <ScanLine className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold leading-tight sm:text-lg">
             Scanora: Barcode &amp; QR Scanner
            </h1>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              Scan, review details, export to Excel
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          {count} {count === 1 ? "scan" : "scans"}
        </span>
      </div>
    </header>
  );
}