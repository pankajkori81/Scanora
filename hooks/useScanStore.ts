// File: hooks/useScanStore.ts
"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import { parseCode } from "@/lib/parse";
import type { ScanRecord, ScanSource } from "@/lib/types";

const STORAGE_KEY = "labelscan:v1";
const DUPLICATE_WINDOW_MS = 2500; // the camera sees the same code many times per second
const EMPTY: ScanRecord[] = []; // stable server snapshot (the server has no localStorage)

/* ---- A tiny external store backed by localStorage ----
   useSyncExternalStore is React's official way to read data that lives outside React.
   It avoids hydration mismatches and keeps multiple browser tabs in sync.
   To move to a database later, replace read() and write() with API calls. */

const listeners = new Set<() => void>();
let cache: ScanRecord[] | null = null;

function read(): ScanRecord[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as ScanRecord[];
  } catch {
    cache = []; // corrupted or blocked storage: start empty
  }
  return cache;
}

function write(next: ScanRecord[]) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked: data stays in memory for this session */
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null; // another tab changed the data: re-read it
      notify();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function useScanStore() {
  const scans = useSyncExternalStore(subscribe, read, () => EMPTY);
  const lastSeen = useRef({ code: "", at: 0 });

  /** Returns the new record, or null if it was an immediate duplicate. */
  const add = useCallback(
    (input: { code: string; format: string; source: ScanSource }): ScanRecord | null => {
      const now = Date.now();
      if (input.code === lastSeen.current.code && now - lastSeen.current.at < DUPLICATE_WINDOW_MS) {
        lastSeen.current.at = now;
        return null;
      }
      lastSeen.current = { code: input.code, at: now };

      const record: ScanRecord = {
        id: makeId(),
        code: input.code,
        format: input.format,
        source: input.source,
        scannedAt: new Date(now).toISOString(),
        note: "",
        parsed: parseCode(input.code, input.format),
      };
      write([record, ...read()]);
      return record;
    },
    []
  );

  const updateNote = useCallback((id: string, note: string) => {
    write(read().map((s) => (s.id === id ? { ...s, note } : s)));
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((s) => s.id !== id));
  }, []);

  const clear = useCallback(() => write([]), []);

  return { scans, add, updateNote, remove, clear };
}