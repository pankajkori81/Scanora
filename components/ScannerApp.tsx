// File: components/ScannerApp.tsx
"use client";

import { useCallback } from "react";
import { CameraPanel } from "@/components/CameraPanel";
import { Header } from "@/components/Header";
import { HistoryList } from "@/components/HistoryList";
import { ManualEntry } from "@/components/ManualEntry";
import { ResultCard } from "@/components/ResultCard";
import { useScanStore } from "@/hooks/useScanStore";
import { notifyScan } from "@/lib/feedback";
import type { DecodeResult, ScanSource } from "@/lib/types";

/** Orchestrator: connects the scanner inputs to the store and the display components. */
export function ScannerApp() {
  const { scans, add, updateNote, remove, clear } = useScanStore();

  const handleDetect = useCallback(
    (result: DecodeResult, source: ScanSource) => {
      const record = add({ code: result.text, format: result.format, source });
      if (record) notifyScan(); // null means it was a duplicate frame
    },
    [add]
  );

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header count={scans.length} />
      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start lg:py-8">
        <div className="min-w-0 space-y-6 lg:sticky lg:top-24">
          <CameraPanel onDetect={handleDetect} />
          <ManualEntry onAdd={(code) => handleDetect({ text: code, format: "MANUAL" }, "manual")} />
        </div>
        <div className="min-w-0 space-y-6">
          <ResultCard scan={scans[0]} />
          <HistoryList scans={scans} onNote={updateNote} onRemove={remove} onClear={clear} />
        </div>
      </main>
    </div>
  );
}