// File: components/ManualEntry.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ManualEntry({ onAdd }: { onAdd: (code: string) => void }) {
  const [value, setValue] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const code = value.trim();
    if (!code) return;
    onAdd(code);
    setValue("");
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <label htmlFor="manual-code" className="mb-2 block text-sm font-semibold">
        Enter a code manually
      </label>
      <div className="flex gap-2">
        <input
          id="manual-code"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 8901248164276"
          autoComplete="off"
          className="min-h-11 min-w-0 flex-1 rounded-xl border-0 bg-slate-50 px-3 text-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:outline-none dark:bg-slate-800 dark:ring-slate-700"
        />
        <Button type="submit" variant="secondary">
          <Plus className="size-4" aria-hidden /> Add
        </Button>
      </div>
    </form>
  );
}