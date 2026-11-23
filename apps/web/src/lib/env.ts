import { isSupabaseConfigured } from "@cwg/api";

export function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return { url, anonKey, configured: isSupabaseConfigured({ url, anonKey }) };
}
