"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CONFIG_MISSING_MESSAGE_PT, listMessages, sendMessage } from "@cwg/api";

import { ConfigBanner } from "@/components/ConfigBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv } from "@/lib/env";

type Msg = {
  id: string;
  body: string;
  sent_at: string;
  sender_id: string;
};

export default function ThreadPage() {
  const { id } = useParams<{ id: string }>();
  const { configured } = getPublicSupabaseEnv();
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!configured || !id) return;
    const client = createClient();
    if (!client) return;
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) {
      setError("Faça login.");
      return;
    }
    setUserId(auth.user.id);
    const { data, error: err } = await listMessages(client, id);
    if (err) setError(err.message);
    else setRows((data as Msg[]) ?? []);
  }, [configured, id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function send() {
    if (!body.trim() || !userId || !id) return;
    const client = createClient();
    if (!client) return;
    const { error: err } = await sendMessage(client, {
      conversation_id: id,
      sender_id: userId,
      body: body.trim(),
    });
    if (err) setError(err.message);
    else {
      setBody("");
      await reload();
    }
  }

  return (
    <>
      <ConfigBanner />
      <SiteHeader />
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col px-6 py-12">
        <Link href="/mensagens" className="text-sm text-[var(--cwg-green)]">
          ← Conversas
        </Link>
        <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-2xl text-[var(--cwg-green-deep)]">
          Conversa
        </h1>
        {!configured ? (
          <p className="mt-8 text-sm">{CONFIG_MISSING_MESSAGE_PT}</p>
        ) : (
          <>
            {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
            <ul className="mt-6 flex-1 space-y-3 overflow-y-auto text-sm">
              {rows.map((m) => (
                <li
                  key={m.id}
                  className={`max-w-[85%] rounded-[10px] px-3 py-2 ${
                    m.sender_id === userId
                      ? "ml-auto bg-[var(--cwg-green)] text-white"
                      : "bg-white border border-[var(--cwg-graphite-100)]"
                  }`}
                >
                  {m.body}
                  <div
                    className={`mt-1 text-[10px] ${m.sender_id === userId ? "text-white/70" : "text-[var(--cwg-graphite-400)]"}`}
                  >
                    {new Date(m.sent_at).toLocaleString("pt-BR")}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <input
                className="flex-1 rounded-[10px] border px-3 py-2 text-sm"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Mensagem"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void send();
                }}
              />
              <button
                type="button"
                onClick={() => void send()}
                className="rounded-[10px] bg-[var(--cwg-green)] px-4 py-2 text-sm font-semibold text-white"
              >
                Enviar
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
}
