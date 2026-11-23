export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

export function isSupabaseConfigured(env: Partial<SupabasePublicEnv>): env is SupabasePublicEnv {
  return Boolean(env.url?.trim() && env.anonKey?.trim());
}

export const CONFIG_MISSING_MESSAGE_PT =
  "Supabase não configurado. Copie `.env.example` para `.env` e preencha NEXT_PUBLIC_SUPABASE_URL / ANON_KEY (web) ou EXPO_PUBLIC_* (mobile) após `supabase link`.";

export const CONFIG_MISSING_MESSAGE_EN =
  "Supabase is not configured. Copy `.env.example` and set the public URL + anon key after linking a project.";
