"use client";

import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { readDemoSessionClient } from "@/lib/demo/client-session";
import { DEMO_STATS } from "@/lib/demo/data";
import { getPublicSupabaseEnv } from "@/lib/env";

export default function EstatisticasPage() {
  const { configured } = getPublicSupabaseEnv();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!configured) {
      readDemoSessionClient();
    }
    setReady(true);
  }, [configured]);

  const stats = DEMO_STATS;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
          Estatísticas
        </h1>
        <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">
          Painel do especialista — métricas operacionais, sem ranking pago.
        </p>
        {ready ? (
          <dl className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="border-b border-[var(--cwg-graphite-100)] pb-4">
              <dt className="text-sm text-[var(--cwg-text-secondary)]">
                Agendamentos no mês
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-graphite-900)]">
                {stats.appointmentsMonth}
              </dd>
            </div>
            <div className="border-b border-[var(--cwg-graphite-100)] pb-4">
              <dt className="text-sm text-[var(--cwg-text-secondary)]">
                Taxa de confirmação
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-graphite-900)]">
                {Math.round(stats.confirmedRate * 100)}%
              </dd>
            </div>
            <div className="border-b border-[var(--cwg-graphite-100)] pb-4">
              <dt className="text-sm text-[var(--cwg-text-secondary)]">
                Avaliação média
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-graphite-900)]">
                {stats.avgRating.toFixed(1)}
              </dd>
            </div>
            <div className="border-b border-[var(--cwg-graphite-100)] pb-4">
              <dt className="text-sm text-[var(--cwg-text-secondary)]">
                Clientes ativos (CRM)
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-graphite-900)]">
                {stats.activeClients}
              </dd>
            </div>
            <div className="border-b border-[var(--cwg-graphite-100)] pb-4 sm:col-span-2">
              <dt className="text-sm text-[var(--cwg-text-secondary)]">
                Tempo médio de resposta
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-graphite-900)]">
                {stats.responseHours} h
              </dd>
            </div>
          </dl>
        ) : null}
      </main>
    </>
  );
}
