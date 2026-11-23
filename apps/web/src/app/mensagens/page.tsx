"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CONFIG_MISSING_MESSAGE_PT, listMyConversations } from "@cwg/api";

import { ConfigBanner } from "@/components/ConfigBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv } from "@/lib/env";

type Conv = {
  id: string;
  latest: { body: string; sent_at: string } | null;
  members: Array<{ users?: { full_name?: string; email?: string } | null }>;
};

export default function MensagensPage() {
  const { configured } = getPublicSupabaseEnv();
  const [rows, setRows] = useState<Conv[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    const client = createClient();
    if (!client) return;
    void (async () => {
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) {
        setError("Faça login.");
        return;
      }
      const { data, error: err } = await listMyConversations(client, auth.user.id);
      if (err) setError(err.message);
      else setRows((data as Conv[]) ?? []);
    })();
  }, [configured]);

  return (
    <>
      <ConfigBanner />
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
          Mensagens
        </h1>
        {!configured ? (
          <p className="mt-8 text-sm">{CONFIG_MISSING_MESSAGE_PT}</p>
        ) : error ? (
          <p className="mt-8 text-sm text-red-700">{error}</p>
        ) : (
          <ul className="mt-8 space-y-3">
            {rows.length === 0 ? (
              <li className="text-sm text-[var(--cwg-text-secondary)]">
                Nenhuma conversa. Inicie a partir de um perfil ou solicitação.
              </li>
            ) : (
              rows.map((c) => {
                const other =
                  c.members[0]?.users?.full_name ||
                  c.members[0]?.users?.email ||
                  c.id.slice(0, 8);
                return (
                  <li key={c.id}>
                    <Link
                      href={`/mensagens/${c.id}`}
                      className="block rounded-[10px] border border-[var(--cwg-graphite-100)] bg-white/80 p-4 hover:border-[var(--cwg-green)]"
                    >
                      <div className="font-semibold">{other}</div>
                      <div className="mt-1 text-sm text-[var(--cwg-text-secondary)]">
                        {c.latest?.body || "Sem mensagens"}
                      </div>
                    </Link>
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
