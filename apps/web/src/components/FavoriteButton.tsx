"use client";

import { useEffect, useState } from "react";
import { isFavorite, toggleFavorite } from "@cwg/api";

import { readDemoSessionClient } from "@/lib/demo/client-session";
import { DEMO_FAVORITES } from "@cwg/demo";
import { getPublicSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export function FavoriteButton({ specialistProfileId }: { specialistProfileId: string }) {
  const { configured } = getPublicSupabaseEnv();
  const [on, setOn] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      const session = readDemoSessionClient();
      if (!session) return;
      setOn(DEMO_FAVORITES.some((f) => f.specialist_profiles.id === specialistProfileId));
      return;
    }
    const client = createClient();
    if (!client) return;
    void (async () => {
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) return;
      const { data } = await isFavorite(client, auth.user.id, specialistProfileId);
      setOn(data);
    })();
  }, [configured, specialistProfileId]);

  async function toggle() {
    setMsg(null);
    if (!configured) {
      const session = readDemoSessionClient();
      if (!session) {
        setMsg("Faça login para salvar favoritos.");
        return;
      }
      setOn((v) => !v);
      setMsg(on ? "Removido dos favoritos (demo)." : "Salvo nos favoritos (demo).");
      return;
    }
    const client = createClient();
    if (!client) return;
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) {
      setMsg("Faça login.");
      return;
    }
    const next = !on;
    const { error } = await toggleFavorite(
      client,
      auth.user.id,
      specialistProfileId,
      next,
    );
    if (error) setMsg(error.message);
    else setOn(next);
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => void toggle()}
        className="rounded-[10px] border border-[var(--cwg-graphite-200)] px-4 py-2 text-sm font-medium hover:bg-white"
      >
        {on ? "★ Remover dos favoritos" : "☆ Salvar favorito"}
      </button>
      {msg ? <p className="mt-1 text-xs text-[var(--cwg-text-secondary)]">{msg}</p> : null}
    </div>
  );
}
