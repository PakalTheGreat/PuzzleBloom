import type { SignInInput, SignUpInput } from "@cwg/validation";

import type { CwgSupabase } from "./clients";

export async function signUpWithEmail(client: CwgSupabase, input: SignUpInput) {
  return client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { full_name: input.full_name },
    },
  });
}

export async function signInWithEmail(client: CwgSupabase, input: SignInInput) {
  return client.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
}

/** Google OAuth via Supabase Auth. Configure provider in Supabase dashboard. */
export async function signInWithGoogle(
  client: CwgSupabase,
  opts: { redirectTo: string; queryParams?: Record<string, string> },
) {
  return client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: opts.redirectTo,
      queryParams: opts.queryParams,
    },
  });
}

export async function signOut(client: CwgSupabase) {
  return client.auth.signOut();
}

export async function requestPasswordRecovery(
  client: CwgSupabase,
  email: string,
  redirectTo?: string,
) {
  return client.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
}

export async function getSession(client: CwgSupabase) {
  return client.auth.getSession();
}

export async function getUser(client: CwgSupabase) {
  return client.auth.getUser();
}
