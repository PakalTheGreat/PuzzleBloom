"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createCrmClient, listCrmClients } from "@cwg/api";

import { SiteHeader } from "@/components/SiteHeader";
import { readDemoSessionClient } from "@/lib/demo/client-session";
import { DEMO_CRM_CLIENTS } from "@cwg/demo";
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
    if (!configured) {
      setRows(
        DEMO_CRM_CLIENTS.filter((c) => c.specialist_profile_id === specialistId).map(
          (c) => ({
            id: c.id,
            display_name: c.display_name,
            status: c.status,
            email: c.email,
            phone: c.phone,
          }),
        ),
      );
      return;
    }
    const client = createClient();
    if (!client) return;
    const { data, error: qErr } = await listCrmClients(client, specialistId);
    if (qErr) setError(qErr.message);
    else setRows((data as ClientRow[]) ?? []);
  }

  useEffect(() => {
    if (!configured) {
      const session = readDemoSessionClient();
      if (!session || session.activeRole !== "specialist") {
        setError("Login especialista necessário.");
        return;
      }
      const id = session.specialistProfileId ?? "sp-ana";
      setSpId(id);
      void load(id);
      return;
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  async function addClient() {
    setError(null);
    if (!spId || !name.trim()) return;
    if (!configured) {
      const id = `crm-local-${Date.now()}`;
      setRows((prev) => [
        {
          id,
          display_name: name.trim(),
          status: "lead",
          email: null,
          phone: null,
        },
        ...prev,
      ]);
      setName("");
      return;
    }
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
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
          CRM
        </h1>
        <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">
          Privado do especialista — nunca público nem visível ao cultivador.
        </p>
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
          {rows.length === 0 && !error ? (
            <li className="text-[var(--cwg-text-secondary)]">Nenhum cliente ainda.</li>
          ) : null}
        </ul>
      </main>
    </>
  );
}
