export * from "./env";
export * from "./clients";
export * from "./auth";
export * from "./profiles";
export * from "./verification";
export * from "./services";

/** React Query key factories (shared where helpful). */
export const queryKeys = {
  me: ["me"] as const,
  specialistBySlug: (slug: string) => ["specialist", "slug", slug] as const,
  specialties: ["specialties"] as const,
  explore: (filters: Record<string, unknown>) => ["explore", filters] as const,
  verification: ["verification"] as const,
};
