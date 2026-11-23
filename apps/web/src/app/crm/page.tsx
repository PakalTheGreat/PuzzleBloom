"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CONFIG_MISSING_MESSAGE_PT, createCrmClient, listCrmClients } from "@cwg/api";

import { ConfigBanner } from "@/components/ConfigBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv } from "@/lib/env";
import { getMySpecialistProfileId } from "@/lib/specialist";

type ClientRow = {
  id: string;
  display_name: string;
  status: string;
  email: string | null;
  phone: string | null;
};

export default function CrmPage() {
  const { configured } = getPublicSupabaseEnv();
  const [spId, setSpId] = useState<string | null>(null);
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  async function load(specialistId: string) {
    const client = createClient();
    if (!client) return;
    const { data, error: qErr } = await listCrmClients(client, specialistId);
    if (qErr) setError(qErr.message);
    else setRows((data as ClientRow[]) ?? []);
  }

  useEffect(() => {
    if (!configured) return;
    const client = createClient();
    if (!client) return;
    void (async () => {
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) {
        setError("Login necessário (papel especialista).");
        return;
      }
      const id = await getMySpecialistProfileId(client, auth.user.id);
      if (!id) {
        setError("Ative o perfil especialista no onboarding.");
        return;
      }
      setSpId(id);
      await load(id);
    })();
  }, [configured]);

  async function addClient() {
    setError(null);
    if (!spId || !name.trim()) return;
    const client = createClient();
    if (!client) return;
    const { error: insErr } = await createCrmClient(client, {
      specialist_profile_id: spId,
      display_name: name.trim(),
      status: "lead",
    });
    if (insErr) setError(insErr.message);
    else {
      setName("");
      await load(spId);
    }
  }

  return (
    <>
      <ConfigBanner />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
          CRM
        </h1>
        <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">
          Privado do especialista — nunca público nem visível ao cultivador.
        </p>
        {!configured ? (
          <p className="mt-8 text-sm">{CONFIG_MISSING_MESSAGE_PT}</p>
        ) : (
          <>
            {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
            <div className="mt-6 flex gap-2">
              <input
                className="flex-1 rounded-[10px] border border-[var(--cwg-graphite-200)] px-3 py-2 text-sm"
                placeholder="Novo cliente (lead)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                type="button"
                onClick={() => void addClient()}
                className="rounded-[10px] bg-[var(--cwg-green)] px-4 py-2 text-sm font-semibold text-white"
              >
                Adicionar
              </button>
            </div>
            <ul className="mt-8 space-y-3 text-sm">
              {rows.map((c) => (
                <li key={c.id} className="border-b border-[var(--cwg-graphite-100)] pb-3">
                  <Link
                    href={`/crm/${c.id}`}
                    className="font-medium text-[var(--cwg-graphite-900)] hover:text-[var(--cwg-green)]"
                  >
                    {c.display_name}
                  </Link>
                  <div className="text-[var(--cwg-text-secondary)]">
                    {c.status} · {c.email || "—"} · {c.phone || "—"}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}
