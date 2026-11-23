import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type CwgSupabase = SupabaseClient;

export function createBrowserSupabaseClient(
  url: string,
  anonKey: string,
): CwgSupabase {
  if (!url || !anonKey) {
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

/** React Query key factories (shared where helpful). */
export const queryKeys = {
  me: ["me"] as const,
  specialistBySlug: (slug: string) => ["specialist", "slug", slug] as const,
  specialties: ["specialties"] as const,
  explore: (filters: Record<string, unknown>) =>
    ["explore", filters] as const,
};
