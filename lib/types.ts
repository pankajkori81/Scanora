// File: lib/types.ts
// Shared types. Keeping them in one place means UI, hooks and lib stay in sync.

export type ScanSource = "camera" | "photo" | "manual";

export type CodeCategory = "product" | "url" | "wifi" | "email" | "phone" | "text";

export interface DetailField {
  label: string;
  value: string;
}

/** Human-friendly interpretation of a raw scanned string. */
export interface ParsedCode {
  category: CodeCategory;
  title: string;
  fields: DetailField[];
  /** Only set for safe, openable schemes (http, https, mailto, tel). */
  href?: string;
}

export interface ScanRecord {
  id: string;
  code: string;
  format: string;
  source: ScanSource;
  scannedAt: string; // ISO timestamp
  note: string;
  parsed: ParsedCode;
}

/** Output of the decoder, before it becomes a ScanRecord. */
export interface DecodeResult {
  text: string;
  format: string;
}