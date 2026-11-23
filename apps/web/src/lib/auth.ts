import { redirect } from "next/navigation";

import { getPublicSupabaseEnv } from "@/lib/env";
import { readDemoSessionClient } from "@/lib/demo/client-session";
import { getDemoSessionServer } from "@/lib/demo/session";
import type { AppRole, DemoSession } from "@cwg/demo";
import { createClient } from "@/lib/supabase/server";

export type AppSession = DemoSession & {
  mode: "demo" | "supabase";
};

export function isDemoMode() {
  return !getPublicSupabaseEnv().configured;
}

export async function getAppSession(): Promise<AppSession | null> {
  if (isDemoMode()) {
    const demo = await getDemoSessionServer();
    return demo ? { ...demo, mode: "demo" } : null;
  }

  const client = await createClient();
  if (!client) return null;
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;

  const { data: rolesRows } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  const roles = (rolesRows ?? []).map((r) => r.role as AppRole);
  const { data: profile } = await client
    .from("users")
    .select("full_name, active_role")
    .eq("id", user.id)
    .maybeSingle();
  const { data: specialist } = await client
    .from("specialist_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const { data: grower } = await client
    .from("grower_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const activeRole =
    (profile?.active_role as AppRole | null) ?? roles[0] ?? "grower";

  return {
    mode: "supabase",
    userId: user.id,
    email: user.email ?? "",
    fullName:
      (profile?.full_name as string | null) ||
      (user.user_metadata?.full_name as string | undefined) ||
      user.email ||
      "Usuário",
    roles: roles.length ? roles : ["grower"],
    activeRole,
    onboardingComplete: roles.length > 0,
    specialistProfileId: (specialist?.id as string | undefined) ?? null,
    growerProfileId: (grower?.id as string | undefined) ?? null,
  };
}

export function getClientSession(): AppSession | null {
  if (!isDemoMode()) return null;
  const demo = readDemoSessionClient();
  return demo ? { ...demo, mode: "demo" } : null;
}

export function loginPath(returnTo?: string) {
  if (!returnTo) return "/entrar";
  return `/entrar?next=${encodeURIComponent(returnTo)}`;
}

export async function requireSession(returnTo: string): Promise<AppSession> {
  const session = await getAppSession();
  if (!session) redirect(loginPath(returnTo));
  return session;
}

export async function requireSpecialist(returnTo: string): Promise<AppSession> {
  const session = await requireSession(returnTo);
  if (session.activeRole !== "specialist") {
    redirect("/conta");
  }
  return session;
}

export async function requireAdmin(returnTo: string): Promise<AppSession> {
  const session = await requireSession(returnTo);
  if (!session.roles.includes("admin")) redirect("/conta");
  return session;
}

export async function requireAnyAuth(returnTo: string) {
  return requireSession(returnTo);
}
