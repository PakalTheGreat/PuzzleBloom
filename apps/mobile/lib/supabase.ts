import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import {
  CONFIG_MISSING_MESSAGE_PT,
  createMobileSupabaseClient,
  isSupabaseConfigured,
  type CwgSupabase,
  type SupportedStorage,
} from "@cwg/api";

const ExpoSecureStoreAdapter: SupportedStorage = {
  getItem: (key) => {
    if (Platform.OS === "web") {
      try {
        return Promise.resolve(globalThis.localStorage?.getItem(key) ?? null);
      } catch {
        return Promise.resolve(null);
      }
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key, value) => {
    if (Platform.OS === "web") {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        /* ignore */
      }
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key) => {
    if (Platform.OS === "web") {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        /* ignore */
      }
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export function getMobileEnv() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return { url, anonKey, configured: isSupabaseConfigured({ url, anonKey }) };
}

let client: CwgSupabase | null | undefined;

export function getSupabase(): CwgSupabase | null {
  const env = getMobileEnv();
  if (!env.configured) return null;
  if (client === undefined) {
    client = createMobileSupabaseClient(
      { url: env.url, anonKey: env.anonKey },
      ExpoSecureStoreAdapter,
    );
  }
  return client ?? null;
}

export { CONFIG_MISSING_MESSAGE_PT };
