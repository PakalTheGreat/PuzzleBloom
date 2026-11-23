import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { isSupabaseConfigured, type SupabasePublicEnv } from "./env";

export type CwgSupabase = SupabaseClient;

export type SupportedStorage = {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
};

export function createBrowserSupabaseClient(
  url: string,
  anonKey: string,
): CwgSupabase {
  if (!isSupabaseConfigured({ url, anonKey })) {
    throw new Error(
      "Missing Supabase URL or anon key. Copy .env.example and fill values after linking a project.",
    );
  }
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/** Mobile client with Expo SecureStore (or any SupportedStorage). */
export function createMobileSupabaseClient(
  env: SupabasePublicEnv,
  storage: SupportedStorage,
): CwgSupabase {
  return createClient(env.url, env.anonKey, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}
