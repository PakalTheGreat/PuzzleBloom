"use client";

import { useState } from "react";
import { createServiceRequest } from "@cwg/api";

import { createClient } from "@/lib/supabase/client";

export function RequestServiceButton({
  specialistProfileId,
}: {
  specialistProfileId: string;
}) {
  const [mode, setMode] = useState<"remote" | "in_person">("remote");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setStatus(null);
    const client = createClient();
    if (!client) {
      setStatus("Configure o Supabase no .env.");
      return;
    }
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) {
      setStatus("Faça login para solicitar.");
      return;
    }
    setLoading(true);
    const { error } = await createServiceRequest(client, {
      grower_user_id: auth.user.id,
      specialist_profile_id: specialistProfileId,
      mode,
      message: message || undefined,
    });
    setLoading(false);
    if (error) setStatus(error.message);
    else setStatus("Solicitação enviada. Acompanhe em /solicitacoes.");
  }

  return (
    <div className="mt-8 rounded-[10px] border border-[var(--cwg-graphite-100)] bg-white p-4">
      <h2 className="font-semibold text-[var(--cwg-graphite-900)]">Solicitar serviço</h2>
      <div className="mt-3 flex gap-3 text-sm">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={mode === "remote"}
            onChange={() => setMode("remote")}
          />
          Remoto
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={mode === "in_person"}
            onChange={() => setMode("in_person")}
          />
          Presencial
        </label>
      </div>
      <textarea
        className="mt-3 w-full rounded border px-2 py-1 text-sm"
        placeholder="Mensagem"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => void submit()}
        className="mt-3 rounded-[10px] bg-[var(--cwg-green)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        Enviar solicitação
      </button>
      {status ? <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">{status}</p> : null}
    </div>
  );
}
