import type { DemoSession } from "./types";

function toBase64Url(input: string): string {
  if (typeof window === "undefined" && typeof Buffer !== "undefined") {
    return Buffer.from(input, "utf8").toString("base64url");
  }
  const b64 = btoa(unescape(encodeURIComponent(input)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): string {
  // Prefer browser atob — Next may polyfill Buffer without base64url support.
  if (typeof window !== "undefined" && typeof atob === "function") {
    const padded = input.replace(/-/g, "+").replace(/_/g, "/");
    const pad =
      padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    return decodeURIComponent(escape(atob(padded + pad)));
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "base64url").toString("utf8");
  }
  throw new Error("No base64 decoder available");
}

export function encodeDemoSession(session: DemoSession): string {
  return toBase64Url(JSON.stringify(session));
}

export function decodeDemoSession(raw: string | undefined | null): DemoSession | null {
  if (!raw) return null;
  try {
    const json = fromBase64Url(raw);
    const parsed = JSON.parse(json) as DemoSession;
    if (!parsed?.userId || !parsed?.activeRole || !Array.isArray(parsed.roles)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
