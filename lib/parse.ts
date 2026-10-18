// File: lib/parse.ts
// Turns a raw scanned string into structured, displayable details.
// Pure functions only (no React, no browser APIs), so they are easy to test.

import type { ParsedCode } from "./types";

// GS1 prefix -> the GS1 office that allocated the number range.
// NOTE: this is where the barcode number was issued, not always where the product was made.
const GS1_PREFIXES: Array<[number, number, string]> = [
  [0, 139, "United States & Canada"],
  [300, 379, "France"],
  [400, 440, "Germany"],
  [450, 459, "Japan"],
  [460, 469, "Russia"],
  [490, 499, "Japan"],
  [500, 509, "United Kingdom"],
  [690, 699, "China"],
  [800, 839, "Italy"],
  [840, 849, "Spain"],
  [880, 880, "South Korea"],
  [885, 885, "Thailand"],
  [890, 890, "India"],
  [899, 899, "Indonesia"],
  [930, 939, "Australia"],
  [955, 955, "Malaysia"],
  [978, 979, "Bookland (ISBN)"],
];

function gs1Country(digits: string): string | null {
  const prefix = Number(digits.slice(0, 3));
  const hit = GS1_PREFIXES.find(([from, to]) => prefix >= from && prefix <= to);
  return hit ? hit[2] : null;
}

/** GTIN check digit (works for EAN-8, UPC-A, EAN-13 and GTIN-14). */
export function isValidGtin(digits: string): boolean {
  const nums = digits.split("").map(Number);
  const check = nums.pop() as number;
  const sum = nums
    .reverse()
    .reduce((acc, n, i) => acc + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

function parseProduct(text: string, format: string): ParsedCode {
  const kinds: Record<number, string> = {
    8: "EAN-8",
    12: "UPC-A",
    13: "EAN-13",
    14: "GTIN-14",
  };
  const kind = format === "UPC_E" ? "UPC-E" : kinds[text.length];
  const isBook = text.length === 13 && /^97[89]/.test(text);

  const fields = [{ label: "Standard", value: kind }];
  // UPC-E is a compressed form, so its check digit is verified differently. Skip it.
  if (format !== "UPC_E") {
    fields.push({
      label: "Check digit",
      value: isValidGtin(text) ? "Valid" : "Invalid (possible misread)",
    });
  }
  const country =
    text.length === 13 ? gs1Country(text) : text.length === 12 ? "United States & Canada" : null;
  if (country) fields.push({ label: "Number issued in", value: country });

  return { category: "product", title: isBook ? "Book (ISBN)" : "Product barcode", fields };
}

function parseWifi(text: string): ParsedCode {
  // Format: WIFI:T:WPA;S:NetworkName;P:password;;
  const parts: Record<string, string> = {};
  for (const part of text.slice(5).split(";")) {
    const i = part.indexOf(":");
    if (i > 0) parts[part.slice(0, i)] = part.slice(i + 1);
  }
  return {
    category: "wifi",
    title: "Wi-Fi network",
    fields: [
      { label: "Network", value: parts.S ?? "-" },
      { label: "Security", value: parts.T ?? "Open" },
      { label: "Password", value: parts.P ?? "-" },
    ],
  };
}

export function parseCode(raw: string, format: string): ParsedCode {
  const text = raw.trim();

  if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text);
      return {
        category: "url",
        title: "Web link",
        href: url.href,
        fields: [
          { label: "Domain", value: url.hostname },
          { label: "Path", value: `${url.pathname}${url.search}` || "/" },
        ],
      };
    } catch {
      /* fall through to plain text */
    }
  }

  if (/^WIFI:/i.test(text)) return parseWifi(text);

  if (/^mailto:/i.test(text)) {
    const [address, query = ""] = text.slice(7).split("?");
    const subject = new URLSearchParams(query).get("subject");
    const fields = [{ label: "Email", value: address }];
    if (subject) fields.push({ label: "Subject", value: subject });
    return { category: "email", title: "Email address", href: text, fields };
  }

  if (/^tel:/i.test(text)) {
    return {
      category: "phone",
      title: "Phone number",
      href: text,
      fields: [{ label: "Number", value: text.slice(4) }],
    };
  }

  if (/^(\d{8}|\d{12,14})$/.test(text)) return parseProduct(text, format);

  return {
    category: "text",
    title: "Text",
    fields: [{ label: "Length", value: `${text.length} characters` }],
  };
}