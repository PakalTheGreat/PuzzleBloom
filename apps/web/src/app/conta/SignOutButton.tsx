"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@cwg/api";

import { clearDemoSessionClient } from "@/lib/demo/client-session";
import { getPublicSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function onClick() {
    if (!getPublicSupabaseEnv().configured) {
      await fetch("/api/demo/logout", { method: "POST" });
      clearDemoSessionClient();
      router.push("/");
      router.refresh();
      return;
    }
    const client = createClient();
    if (client) await signOut(client);
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      className="rounded-[10px] border border-[var(--cwg-graphite-200)] px-4 py-2 text-sm font-medium text-[var(--cwg-graphite-900)] hover:bg-white"
    >
      Sair
    </button>
  );
}
