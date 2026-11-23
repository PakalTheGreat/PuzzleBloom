import { LEGAL_VERSIONS } from "@cwg/shared";
import { DEMO_LEGAL_COOKIE } from "@cwg/demo";

export type CultivationAuthRecord = {
  document: "cultivation_authorization";
  documentVersion: string;
  acceptedAt: string;
};

const STORAGE_KEY = "cwg_cultivation_auth";

export function readCultivationAuthClient(): CultivationAuthRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const rawLocal = window.localStorage.getItem(STORAGE_KEY);
    const rawCookie = document.cookie
      .split("; ")
      .find((r) => r.startsWith(`${DEMO_LEGAL_COOKIE}=`))
      ?.slice(DEMO_LEGAL_COOKIE.length + 1);
    const raw = rawLocal ?? (rawCookie ? decodeURIComponent(rawCookie) : null);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CultivationAuthRecord;
    if (
      parsed?.document !== "cultivation_authorization" ||
      parsed.documentVersion !== LEGAL_VERSIONS.cultivationAuthorization
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeCultivationAuthClient(): CultivationAuthRecord {
  const record: CultivationAuthRecord = {
    document: "cultivation_authorization",
    documentVersion: LEGAL_VERSIONS.cultivationAuthorization,
    acceptedAt: new Date().toISOString(),
  };
  const encoded = encodeURIComponent(JSON.stringify(record));
  const maxAge = 60 * 60 * 24 * 365;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* ignore */
  }
  document.cookie = `${DEMO_LEGAL_COOKIE}=${encoded}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  return record;
}

export function cultivationAcceptanceForSession(
  record: CultivationAuthRecord | null = readCultivationAuthClient(),
) {
  if (!record) return [];
  return [
    {
      document: "cultivation_authorization" as const,
      documentVersion: record.documentVersion,
      acceptedAt: record.acceptedAt,
    },
  ];
}
