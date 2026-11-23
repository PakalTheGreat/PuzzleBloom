import type { ActiveRole, AppRole } from "@cwg/types";

export * from "./tokens";
export * from "./legal";
export * from "./geo";

export const APP_NAME = "CWG";
export const APP_NAME_FULL = "Connect With Growers";
export const DEFAULT_LOCALE = "pt-BR";
export const DEFAULT_TIMEZONE = "America/Sao_Paulo";
export const DEFAULT_CURRENCY = "BRL";

/** Entitlement keys — never map these to reputation fields. */
export const ENTITLEMENTS = {
  CRM_CLIENT_CAP: "crm_client_cap",
  ANALYTICS_DEPTH: "analytics_depth",
  PORTFOLIO_ITEMS_CAP: "portfolio_items_cap",
} as const;

export type EntitlementKey = (typeof ENTITLEMENTS)[keyof typeof ENTITLEMENTS];

export function isSpecialistRole(role: AppRole | ActiveRole | null | undefined): boolean {
  return role === "specialist";
}

export function isGrowerRole(role: AppRole | ActiveRole | null | undefined): boolean {
  return role === "grower";
}

/** Format BRL for display (pt-BR). */
export function formatBrl(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

/** Very light BR phone display helper (Phase 1 stub). */
export function formatPhoneBr(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function slugifyName(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
