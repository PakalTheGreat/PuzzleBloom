export * from "./env";
export * from "./clients";
export * from "./auth";
export * from "./profiles";
export * from "./verification";
export * from "./appointments";
export * from "./crm";
export * from "./calendar";
export * from "./messaging";
export * from "./favorites";
export { getEntitlement } from "./services";

export const queryKeys = {
  me: ["me"] as const,
  specialistBySlug: (slug: string) => ["specialist", "slug", slug] as const,
  specialties: ["specialties"] as const,
  explore: (filters: Record<string, unknown>) => ["explore", filters] as const,
  verification: ["verification"] as const,
  appointments: ["appointments"] as const,
  crm: ["crm"] as const,
  messages: ["messages"] as const,
  favorites: ["favorites"] as const,
  calendar: ["calendar"] as const,
};
