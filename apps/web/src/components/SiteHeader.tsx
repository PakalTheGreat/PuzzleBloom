"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { readDemoSessionClient } from "@/lib/demo/client-session";
import type { DemoSession } from "@cwg/demo";
import { getPublicSupabaseEnv } from "@/lib/env";

export function SiteHeader() {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getPublicSupabaseEnv().configured) {
      setSession(readDemoSessionClient());
    }
    setReady(true);
  }, []);

  const isSpecialist = session?.activeRole === "specialist";
  const isGrower = session?.activeRole === "grower";
  const isAdmin = Boolean(session?.roles.includes("admin"));

  return (
    <header className="border-b border-[var(--cwg-graphite-100)] bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-fraunces)] text-xl text-[var(--cwg-green-deep)]"
        >
          CWG
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-[var(--cwg-text-secondary)]">
          <Link href="/tecnicos" className="hover:text-[var(--cwg-green)]">
            Especialistas
          </Link>

          {ready && isSpecialist ? (
            <>
              <Link href="/solicitacoes" className="hover:text-[var(--cwg-green)]">
                Solicitações
              </Link>
              <Link href="/agendamentos" className="hover:text-[var(--cwg-green)]">
                Agenda
              </Link>
              <Link href="/calendario" className="hover:text-[var(--cwg-green)]">
                Calendário
              </Link>
              <Link href="/crm" className="hover:text-[var(--cwg-green)]">
                CRM
              </Link>
              <Link href="/estatisticas" className="hover:text-[var(--cwg-green)]">
                Estatísticas
              </Link>
              <Link href="/assinatura" className="hover:text-[var(--cwg-green)]">
                Assinatura
              </Link>
              <Link href="/mensagens" className="hover:text-[var(--cwg-green)]">
                Mensagens
              </Link>
            </>
          ) : null}

          {ready && isGrower ? (
            <>
              <Link href="/favoritos" className="hover:text-[var(--cwg-green)]">
                Favoritos
              </Link>
              <Link href="/agendamentos" className="hover:text-[var(--cwg-green)]">
                Agendamentos
              </Link>
              <Link href="/mensagens" className="hover:text-[var(--cwg-green)]">
                Mensagens
              </Link>
            </>
          ) : null}

          {ready && isAdmin ? (
            <Link href="/admin" className="hover:text-[var(--cwg-green)]">
              Admin
            </Link>
          ) : null}

          {ready && session ? (
            <Link
              href="/conta"
              className="rounded-[10px] bg-[var(--cwg-green)] px-3 py-1.5 font-medium text-white hover:bg-[var(--cwg-green-deep)]"
            >
              {session.fullName.split(" ")[0]}
            </Link>
          ) : ready ? (
            <>
              <Link href="/entrar" className="hover:text-[var(--cwg-green)]">
                Entrar
              </Link>
              <Link
                href="/cadastrar"
                className="rounded-[10px] bg-[var(--cwg-green)] px-3 py-1.5 font-medium text-white hover:bg-[var(--cwg-green-deep)]"
              >
                Cadastrar
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
