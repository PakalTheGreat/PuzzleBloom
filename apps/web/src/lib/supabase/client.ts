"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseEnv } from "../env";

export function createClient() {
  const { url, anonKey, configured } = getPublicSupabaseEnv();
  if (!configured) return null;
  return createBrowserClient(url, anonKey);
}
