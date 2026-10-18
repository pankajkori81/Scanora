// File: components/ResultCard.tsx
"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { CodeCategory, ScanRecord } from "@/lib/types";

const BADGE: Record<CodeCategory, string> = {
  product: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  url: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  wifi: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  email: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  phone: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  text: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export function ResultCard({ scan }: { scan: ScanRecord | undefined }) {
  const [copied, setCopied] = useState(false);

  if (!scan) {
    return (
      <section className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/50 p-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
        <ScanBarcode className="mb-3 size-10 text-slate-400" aria-hidden />
        <h2 className="font-semibold">No scan yet</h2>
        <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
          Scan a barcode or QR code and its details will appear here.
        </p>
      </section>
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(scan!.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:border-l-emerald-500 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Latest scan
        </h2>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", BADGE[scan.parsed.category])}>
          {scan.parsed.title}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {scan.format.replace(/_/g, " ")}
        </span>
      </div>

      <p className="mt-3 break-all font-mono text-xl font-semibold sm:text-2xl">{scan.code}</p>

      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {scan.parsed.fields.map((f) => (
          <div key={f.label} className="min-w-0">
            <dt className="text-xs text-slate-500 dark:text-slate-400">{f.label}</dt>
            <dd className="break-words text-sm font-medium">{f.value}</dd>
          </div>
        ))}
        <div className="min-w-0">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Scanned</dt>
          <dd className="text-sm font-medium">{new Date(scan.scannedAt).toLocaleString()}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={copy}>
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "Copied" : "Copy code"}
        </Button>
        {scan.parsed.href && (
          <a
            href={scan.parsed.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            <ExternalLink className="size-4" aria-hidden /> Open
          </a>
        )}
      </div>
    </section>
  );
}