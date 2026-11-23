"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listFavorites, toggleFavorite } from "@cwg/api";

import { SiteHeader } from "@/components/SiteHeader";
import { readDemoSessionClient } from "@/lib/demo/client-session";
import { DEMO_FAVORITES } from "@cwg/demo";
import { createClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv } from "@/lib/env";

type Fav = {
  id: string;
  specialist_profiles?: {
    id: string;
    slug: string;
    headline: string | null;
    city: string | null;
    state: string | null;
    verification_status: string;
    users?: { full_name?: string } | null;
  } | null;
};

export default function FavoritosPage() {
  const { configured } = getPublicSupabaseEnv();
  const [rows, setRows] = useState<Fav[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!configured) {
      const session = readDemoSessionClient();
      if (!session) {
        setError("Faça login.");
        return;
      }
      setError(null);
      setRows([...DEMO_FAVORITES]);
      return;
    }
    const client = createClient();
    if (!client) return;
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) {
      setError("Faça login.");
      return;
    }
    const { data, error: err } = await listFavorites(client, auth.user.id);
    if (err) setError(err.message);
    else setRows((data as unknown as Fav[]) ?? []);
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  async function remove(profileId: string) {
    if (!configured) {
      setRows((prev) => prev.filter((f) => f.specialist_profiles?.id !== profileId));
      return;
    }
    const client = createClient();
    if (!client) return;
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) return;
    await toggleFavorite(client, auth.user.id, profileId, false);
    await reload();
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
          Favoritos
        </h1>
        {error ? (
          <p className="mt-8 text-sm text-red-700">{error}</p>
        ) : (
          <ul className="mt-8 space-y-4">
            {rows.length === 0 ? (
              <li className="text-sm text-[var(--cwg-text-secondary)]">
                Nenhum favorito. Salve especialistas em{" "}
                <Link href="/tecnicos" className="text-[var(--cwg-green)]">
                  /tecnicos
                </Link>
                .
              </li>
            ) : (
              rows.map((f) => {
                const sp = f.specialist_profiles;
                if (!sp) return null;
                return (
                  <li
                    key={f.id}
                    className="flex items-start justify-between gap-4 border-b border-[var(--cwg-graphite-100)] pb-4"
                  >
                    <div>
                      <Link
                        href={`/tecnicos/${sp.slug}`}
                        className="font-semibold text-[var(--cwg-graphite-900)] hover:text-[var(--cwg-green)]"
                      >
                        {sp.users?.full_name || sp.slug}
                      </Link>
                      <p className="mt-1 text-sm text-[var(--cwg-text-secondary)]">
                        {[sp.headline, sp.city, sp.state].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void remove(sp.id)}
                      className="text-xs text-[var(--cwg-text-secondary)] hover:text-red-700"
                    >
                      Remover
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </main>
    </>
  );
}
