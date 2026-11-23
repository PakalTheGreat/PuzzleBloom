import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { LEGAL_VERSIONS } from "@cwg/shared";

const KEY = "cwg.cultivation_auth";

export type CultivationAuthRecord = {
  document: "cultivation_authorization";
  documentVersion: string;
  acceptedAt: string;
};

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function readCultivationAuth(): Promise<CultivationAuthRecord | null> {
  const raw = await getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CultivationAuthRecord;
    if (
      parsed.document !== "cultivation_authorization" ||
      parsed.documentVersion !== LEGAL_VERSIONS.cultivationAuthorization
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writeCultivationAuth(): Promise<CultivationAuthRecord> {
  const record: CultivationAuthRecord = {
    document: "cultivation_authorization",
    documentVersion: LEGAL_VERSIONS.cultivationAuthorization,
    acceptedAt: new Date().toISOString(),
  };
  await setItem(KEY, JSON.stringify(record));
  return record;
}

export function toDemoLegalAcceptance(record: CultivationAuthRecord) {
  return {
    document: "cultivation_authorization" as const,
    documentVersion: record.documentVersion,
    acceptedAt: record.acceptedAt,
  };
}
