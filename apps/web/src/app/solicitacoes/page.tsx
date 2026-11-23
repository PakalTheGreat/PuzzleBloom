"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  acceptRequestWithAppointment,
  listServiceRequestsForGrower,
  listServiceRequestsForSpecialist,
  updateServiceRequestStatus,
} from "@cwg/api";

import { SiteHeader } from "@/components/SiteHeader";
import { readDemoSessionClient } from "@/lib/demo/client-session";
import { DEMO_REQUESTS } from "@/lib/demo/data";
import { createClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv } from "@/lib/env";
import { getMySpecialistProfileId } from "@/lib/specialist";

type Req = {
  id: string;
  status: string;
  mode: string;
  message: string | null;
  created_at: string;
  grower_user_id: string;
  specialist_profile_id: string;
  users?: { full_name?: string; email?: string } | null;
  specialist_profiles?: {
    slug?: string;
    headline?: string;
    users?: { full_name?: string };
  } | null;
};

export default function SolicitacoesPage() {
  const { configured } = getPublicSupabaseEnv();
  const [role, setRole] = useState<"grower" | "specialist">("specialist");
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [rows, setRows] = useState<Req[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [slotStart, setSlotStart] = useState("");

  const reload = useCallback(async () => {
    if (!configured) {
      const session = readDemoSessionClient();
      if (!session) {
        setError("Faça login.");
        return;
      }
      const spId = session.specialistProfileId ?? "sp-ana";
      setSpecialistId(spId);
      setError(null);
      if (role === "specialist") {
        setRows(
          DEMO_REQUESTS.filter((r) => r.specialist_profile_id === spId) as Req[],
        );
      } else {
        setRows(
          DEMO_REQUESTS.filter(
            (r) =>
              r.grower_user_id === session.userId ||
              r.grower_user_id === "user-carlos",
          ) as Req[],
        );
      }
      return;
    }
    const client = createClient();
    if (!client) return;
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) {
      setError("Faça login.");
      return;
    }
    const spId = await getMySpecialistProfileId(client, auth.user.id);
    setSpecialistId(spId);
    if (role === "specialist") {
      if (!spId) {
        setError("Ative perfil especialista.");
        return;
      }
      const { data, error: err } = await listServiceRequestsForSpecialist(client, spId);
      if (err) setError(err.message);
      else {
        setError(null);
        setRows((data as Req[]) ?? []);
      }
    } else {
      const { data, error: err } = await listServiceRequestsForGrower(
        client,
        auth.user.id,
      );
      if (err) setError(err.message);
      else {
        setError(null);
        setRows((data as Req[]) ?? []);
      }
    }
  }, [configured, role]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function reject(id: string) {
    if (!configured) {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)),
      );
      setInfo("Solicitação rejeitada.");
      return;
    }
    const client = createClient();
    if (!client) return;
    const { error: err } = await updateServiceRequestStatus(client, id, "rejected");
    if (err) setError(err.message);
    else setInfo("Solicitação rejeitada.");
    await reload();
  }

  async function accept(req: Req) {
    if (!slotStart) {
      setError("Informe data/hora de início para aceitar.");
      return;
    }
    if (!configured) {
      setRows((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: "accepted" } : r)),
      );
      setInfo("Aceito — agendamento demo criado. Veja /agendamentos.");
      return;
    }
    const client = createClient();
    if (!client) return;
    const start = new Date(slotStart);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const { error: err } = await acceptRequestWithAppointment(client, {
      requestId: req.id,
      grower_user_id: req.grower_user_id,
      specialist_profile_id: req.specialist_profile_id,
      mode: req.mode as "remote" | "in_person",
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      location_summary: req.mode === "remote" ? "Remoto" : "A combinar (cidade/região)",
    });
    if (err) setError(err.message);
    else setInfo("Aceito — agendamento criado. Veja /agendamentos.");
    await reload();
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
            Solicitações
          </h1>
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setRole("grower")}
              className={`rounded-[10px] px-3 py-1.5 ${role === "grower" ? "bg-[var(--cwg-green)] text-white" : "border"}`}
            >
              Enviadas
            </button>
            <button
              type="button"
              onClick={() => setRole("specialist")}
              disabled={!specialistId && configured}
              className={`rounded-[10px] px-3 py-1.5 disabled:opacity-40 ${role === "specialist" ? "bg-[var(--cwg-green)] text-white" : "border"}`}
            >
              Recebidas
            </button>
          </div>
        </div>
        {role === "specialist" ? (
          <label className="mt-6 block text-sm">
            Slot ao aceitar
            <input
              type="datetime-local"
              className="mt-1 block rounded border px-2 py-1"
              value={slotStart}
              onChange={(e) => setSlotStart(e.target.value)}
            />
          </label>
        ) : null}
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        {info ? <p className="mt-4 text-sm text-[var(--cwg-green)]">{info}</p> : null}
        <ul className="mt-8 space-y-4">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-[10px] border border-[var(--cwg-graphite-100)] bg-white/80 p-4 text-sm"
            >
              <div className="font-semibold">
                {role === "specialist"
                  ? r.users?.full_name || r.grower_user_id.slice(0, 8)
                  : r.specialist_profiles?.users?.full_name ||
                    r.specialist_profiles?.slug}
                {" · "}
                <span className="text-[var(--cwg-green)]">{r.status}</span>
              </div>
              <p className="mt-1 text-[var(--cwg-text-secondary)]">
                {r.mode} · {r.message || "—"}
              </p>
              {role === "specialist" && r.status === "pending" ? (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void accept(r)}
                    className="rounded-[8px] bg-[var(--cwg-green)] px-3 py-1 text-xs font-semibold text-white"
                  >
                    Aceitar + criar agenda
                  </button>
                  <button
                    type="button"
                    onClick={() => void reject(r.id)}
                    className="rounded-[8px] border px-3 py-1 text-xs"
                  >
                    Rejeitar
                  </button>
                </div>
              ) : null}
            </li>
          ))}
          {rows.length === 0 ? (
            <li className="text-sm text-[var(--cwg-text-secondary)]">
              Nenhuma solicitação.
            </li>
          ) : null}
        </ul>
        <Link href="/agendamentos" className="mt-8 inline-block text-sm text-[var(--cwg-green)]">
          Ir para agendamentos
        </Link>
      </main>
    </>
  );
}
