"use client";

import Link from "next/link";
import { formatBrl } from "@cwg/shared";

import { SiteHeader } from "@/components/SiteHeader";

const PLANS = [
  {
    code: "free",
    name: "Essencial",
    price: 0,
    features: ["Perfil público", "Até 5 solicitações/mês", "Mensagens básicas"],
  },
  {
    code: "pro",
    name: "Profissional",
    price: 89,
    features: [
      "CRM completo",
      "Calendário e disponibilidade",
      "Estatísticas",
      "Solicitações ilimitadas",
    ],
  },
  {
    code: "org",
    name: "Organização",
    price: 249,
    features: [
      "Tudo do Profissional",
      "Múltiplos especialistas",
      "Prioridade no suporte",
    ],
  },
];

export default function AssinaturaPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
          Assinatura
        </h1>
        <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">
          Planos liberam ferramentas. Nunca alteram reputação, verificação ou
          posição no diretório.
        </p>
        <ul className="mt-10 space-y-4">
          {PLANS.map((p) => (
            <li
              key={p.code}
              className="rounded-[10px] border border-[var(--cwg-graphite-100)] bg-white/80 p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold text-[var(--cwg-graphite-900)]">
                  {p.name}
                </h2>
                <span className="text-sm text-[var(--cwg-text-secondary)]">
                  {p.price === 0 ? "Grátis" : `${formatBrl(p.price)}/mês`}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-[var(--cwg-text-secondary)]">
                {p.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-4 rounded-[10px] bg-[var(--cwg-green)] px-4 py-2 text-sm font-semibold text-white"
              >
                {p.code === "pro" ? "Plano atual (demo)" : "Selecionar (demo)"}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-xs text-[var(--cwg-graphite-400)]">
          Pagamentos reais ficam para depois.{" "}
          <Link href="/admin/entitlements" className="text-[var(--cwg-green)]">
            Ver entitlements
          </Link>
        </p>
      </main>
    </>
  );
}
