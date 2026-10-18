// File: lib/cn.ts
// Tiny helper to join Tailwind class names conditionally.
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}