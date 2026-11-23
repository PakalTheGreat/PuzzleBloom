"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CONFIG_MISSING_MESSAGE_PT,
  cancelAppointment,
  confirmAppointmentSide,
  listAppointmentsForUser,
  nextAppointmentActions,
  submitReview,
  updateAppointmentStatus,
} from "@cwg/api";

import { ConfigBanner } from "@/components/ConfigBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv } from "@/lib/env";
import { getMySpecialistProfileId } from "@/lib/specialist";

type Appt = {
  id: string;
  status: string;
  starts_at: string;
  ends_at: string;
  mode: string;
  location_summary: string | null;
  grower_user_id: string;
  specialist_profile_id: string;
  specialist_profiles?: {
    slug?: string;
    headline?: string;
    users?: { full_name?: string };
  } | null;
  service_confirmations?: Array<{
    id: string;
    grower_confirmed_at: string | null;
    specialist_confirmed_at: string | null;
  }> | null;
};

export default function AgendamentosPage() {
  const { configured } = getPublicSupabaseEnv();
  const [role, setRole] = useState<"grower" | "specialist">("grower");
  const [userId, setUserId] = useState<string | null>(null);
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [rows, setRows] = useState<Appt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [reviewFor, setReviewFor] = useState<string | null>(null);
  const [scores, setScores] = useState({
    professionalism: 5,
    communication: 5,
    punctuality: 5,
    technical: 5,
    organization: 5,
  });
  const [reviewBody, setReviewBody] = useState("");

  const reload = useCallback(async () => {
    if (!configured) return;
    const client = createClient();
    if (!client) return;
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) {
      setError("Faça login para ver agendamentos.");
      return;
    }
    setUserId(auth.user.id);
    const spId = await getMySpecialistProfileId(client, auth.user.id);
    setSpecialistId(spId);
    const asSpecialist = role === "specialist" && spId;
    const { data, error: qErr } = await listAppointmentsForUser(
      client,
      auth.user.id,
      asSpecialist ? spId : null,
    );
    if (qErr) setError(qErr.message);
    else {
      setError(null);
      setRows((data as Appt[]) ?? []);
    }
  }, [configured, role]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function act(appt: Appt, next: string) {
    setInfo(null);
    setError(null);
    const client = createClient();
    if (!client) return;
    if (next.startsWith("cancelled")) {
      const { error: err } = await cancelAppointment(
        client,
        appt.id,
        role === "grower" ? "grower" : "specialist",
      );
      if (err) setError(err.message);
      else setInfo("Agendamento cancelado.");
    } else {
      const { error: err } = await updateAppointmentStatus(client, appt.id, next);
      if (err) setError(err.message);
      else setInfo(`Status → ${next}`);
    }
    await reload();
  }

  async function confirmSide(appt: Appt) {
    setInfo(null);
    setError(null);
    const client = createClient();
    if (!client) return;
    const { error: err, reviewEligible } = await confirmAppointmentSide(
      client,
      appt.id,
      role,
    );
    if (err) setError(err.message);
    else
      setInfo(
        reviewEligible
          ? "Confirmação mútua completa — avaliação liberada."
          : "Sua confirmação foi registrada. Aguardando a outra parte.",
      );
    await reload();
  }

  async function sendReview(appt: Appt) {
    if (!userId) return;
    const client = createClient();
    if (!client) return;
    const { error: err } = await submitReview(client, {
      author_user_id: userId,
      specialist_profile_id: appt.specialist_profile_id,
      appointment_id: appt.id,
      scores,
      body: reviewBody || undefined,
    });
    if (err) setError(err.message);
    else {
      setInfo("Avaliação enviada.");
      setReviewFor(null);
      setReviewBody("");
    }
  }

  return (
    <>
      <ConfigBanner />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
              Agendamentos
            </h1>
            <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">
              Aceitar → confirmar → completar → confirmação mútua → avaliação.
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setRole("grower")}
              className={`rounded-[10px] px-3 py-1.5 ${role === "grower" ? "bg-[var(--cwg-green)] text-white" : "border"}`}
            >
              Cultivador
            </button>
            <button
              type="button"
              onClick={() => setRole("specialist")}
              disabled={!specialistId}
              className={`rounded-[10px] px-3 py-1.5 disabled:opacity-40 ${role === "specialist" ? "bg-[var(--cwg-green)] text-white" : "border"}`}
            >
              Especialista
            </button>
          </div>
        </div>

        {!configured ? (
          <p className="mt-8 text-sm">{CONFIG_MISSING_MESSAGE_PT}</p>
        ) : (
          <>
            {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
            {info ? <p className="mt-4 text-sm text-[var(--cwg-green)]">{info}</p> : null}
            <ul className="mt-8 space-y-6">
              {rows.length === 0 ? (
                <li className="text-sm text-[var(--cwg-text-secondary)]">
                  Nenhum agendamento. Solicite em um perfil{" "}
                  <Link href="/tecnicos" className="text-[var(--cwg-green)]">
                    /tecnicos
                  </Link>
                  .
                </li>
              ) : (
                rows.map((a) => {
                  const conf = a.service_confirmations?.[0];
                  const mutual =
                    Boolean(conf?.grower_confirmed_at) &&
                    Boolean(conf?.specialist_confirmed_at);
                  const actions = nextAppointmentActions(a.status, role);
                  const name =
                    a.specialist_profiles?.users?.full_name ||
                    a.specialist_profiles?.slug ||
                    a.id.slice(0, 8);
                  return (
                    <li
                      key={a.id}
                      className="rounded-[10px] border border-[var(--cwg-graphite-100)] bg-white/80 p-4"
                    >
                      <div className="font-semibold text-[var(--cwg-graphite-900)]">
                        {name} · <span className="text-[var(--cwg-green)]">{a.status}</span>
                      </div>
                      <div className="mt-1 text-sm text-[var(--cwg-text-secondary)]">
                        {new Date(a.starts_at).toLocaleString("pt-BR")} →{" "}
                        {new Date(a.ends_at).toLocaleString("pt-BR")} · {a.mode}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {actions.map((next) => (
                          <button
                            key={next}
                            type="button"
                            onClick={() => void act(a, next)}
                            className="rounded-[8px] border border-[var(--cwg-graphite-200)] px-3 py-1 text-xs font-medium hover:bg-[var(--cwg-graphite-50)]"
                          >
                            {next}
                          </button>
                        ))}
                        {a.status === "completed" ? (
                          <button
                            type="button"
                            onClick={() => void confirmSide(a)}
                            className="rounded-[8px] bg-[var(--cwg-green)] px-3 py-1 text-xs font-semibold text-white"
                          >
                            Confirmar serviço ({role})
                          </button>
                        ) : null}
                        {mutual && role === "grower" ? (
                          <button
                            type="button"
                            onClick={() => setReviewFor(a.id)}
                            className="rounded-[8px] bg-[var(--cwg-accent)] px-3 py-1 text-xs font-semibold text-[var(--cwg-graphite-950)]"
                          >
                            Avaliar
                          </button>
                        ) : null}
                      </div>
                      {a.status === "completed" ? (
                        <p className="mt-2 text-xs text-[var(--cwg-graphite-400)]">
                          Confirmações: cultivador{" "}
                          {conf?.grower_confirmed_at ? "✓" : "…"} · especialista{" "}
                          {conf?.specialist_confirmed_at ? "✓" : "…"}
                        </p>
                      ) : null}
                      {reviewFor === a.id ? (
                        <div className="mt-4 space-y-2 border-t border-[var(--cwg-graphite-100)] pt-4 text-sm">
                          {(
                            [
                              "professionalism",
                              "communication",
                              "punctuality",
                              "technical",
                              "organization",
                            ] as const
                          ).map((key) => (
                            <label key={key} className="flex items-center justify-between gap-4">
                              <span>{key}</span>
                              <input
                                type="number"
                                min={1}
                                max={5}
                                className="w-16 rounded border px-2 py-1"
                                value={scores[key]}
                                onChange={(e) =>
                                  setScores((s) => ({
                                    ...s,
                                    [key]: Number(e.target.value),
                                  }))
                                }
                              />
                            </label>
                          ))}
                          <textarea
                            className="w-full rounded border px-2 py-1"
                            placeholder="Comentário (opcional)"
                            value={reviewBody}
                            onChange={(e) => setReviewBody(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => void sendReview(a)}
                            className="rounded-[8px] bg-[var(--cwg-green)] px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Enviar avaliação
                          </button>
                        </div>
                      ) : null}
                    </li>
                  );
                })
              )}
            </ul>
            <div className="mt-8 flex gap-4 text-sm">
              <Link href="/solicitacoes" className="text-[var(--cwg-green)]">
                Solicitações
              </Link>
              <Link href="/calendario" className="text-[var(--cwg-green)]">
                Calendário
              </Link>
            </div>
          </>
        )}
      </main>
    </>
  );
}
