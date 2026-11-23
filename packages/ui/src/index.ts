export { colors, radius, spacing, typography } from "@cwg/shared/tokens";

/** Web-oriented class helpers (Tailwind consumers can ignore). */
export const webThemeClass = {
  page: "bg-[var(--cwg-surface-page)] text-[var(--cwg-text)]",
  brandMark: "text-[var(--cwg-green-deep)] font-[family-name:var(--cwg-font-display)]",
  ctaPrimary:
    "inline-flex items-center justify-center rounded-[var(--cwg-radius-md)] bg-[var(--cwg-green)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--cwg-green-deep)] transition-colors",
} as const;
