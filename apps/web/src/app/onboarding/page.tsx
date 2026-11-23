"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LEGAL_COPY } from "@cwg/shared";
import { activateRolesFromIntent, recordLegalAndAge } from "@cwg/api";
import type { RoleIntent } from "@cwg/validation";

import { SiteHeader } from "@/components/SiteHeader";
import {
  clearDemoSessionClient,
  readDemoSessionClient,
  writeDemoSessionClient,
} from "@/lib/demo/client-session";
import type { AppRole, DemoSession } from "@/lib/demo/types";
import { createClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv } from "@/lib/env";

const INTENTS: { id: RoleIntent; title: string; body: string }[] = [
  {
    id: "find",
    title: "Encontrar especialistas",
    body: "Ativa perfil de cultivador para explorar e solicitar serviços.",
  },
  {
    id: "offer",
    title: "Oferecer serviços",
    body: "Ativa perfil de especialista com slug público.",
  },
  {
    id: "both",
    title: "Ambos",
    body: "Uma conta, dois papéis — alterne no app sem novo login.",
  },
];

function rolesFromIntent(intent: RoleIntent): AppRole[] {
  if (intent === "find") return ["grower"];
  if (intent === "offer") return ["specialist"];
  return ["grower", "specialist"];
}

export default function OnboardingPage() {
  const router = useRouter();
  const { configured } = getPublicSupabaseEnv();
  const [step, setStep] = useState<"legal" | "roles">("legal");
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [intent, setIntent] = useState<RoleIntent>("find");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function finishLegal() {
    setError(null);
    if (!age || !terms || !privacy) {
      setError("Confirme idade e aceite Termos e Privacidade.");
      return;
    }

    if (!configured) {
      const session = readDemoSessionClient();
      if (!session) {
        router.push("/entrar?next=/onboarding");
        return;
      }
      setStep("roles");
      return;
    }

    const client = createClient();
    if (!client) {
      setError("Cliente indisponível");
      return;
    }
    setLoading(true);
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) {
      setLoading(false);
      setError("Faça login para continuar o onboarding.");
      router.push("/entrar");
      return;
    }
    const result = await recordLegalAndAge(client, auth.user.id, {
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    });
    setLoading(false);
    if (result.age.error || result.terms.error || result.privacy.error) {
      setError(
        result.age.error?.message ||
          result.terms.error?.message ||
          result.privacy.error?.message ||
          "Falha ao registrar aceites",
      );
      return;
    }
    setStep("roles");
  }

  async function finishRoles() {
    setError(null);

    if (!configured) {
      const current = readDemoSessionClient();
      if (!current) {
        router.push("/entrar?next=/onboarding");
        return;
      }
      setLoading(true);
      const roles = rolesFromIntent(intent);
      const activeRole = roles.includes("specialist") ? "specialist" : "grower";
      const next: DemoSession = {
        ...current,
        roles,
        activeRole,
        onboardingComplete: true,
        specialistProfileId: roles.includes("specialist")
          ? current.specialistProfileId ?? "sp-ana"
          : null,
        growerProfileId: roles.includes("grower")
          ? current.growerProfileId ?? `gp-${current.userId}`
          : null,
      };
      await fetch("/api/demo/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: next }),
      });
      writeDemoSessionClient(next);
      setLoading(false);
      router.push("/conta");
      router.refresh();
      return;
    }

    const client = createClient();
    if (!client) {
      setError("Cliente indisponível");
      return;
    }
    setLoading(true);
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) {
      setLoading(false);
      router.push("/entrar");
      return;
    }
    const fullName =
      (auth.user.user_metadata?.full_name as string | undefined) ?? null;
    const { error: roleError } = await activateRolesFromIntent(
      client,
      auth.user.id,
      intent,
      fullName,
    );
    setLoading(false);
    if (roleError) {
      setError(roleError.message);
      return;
    }
    router.push("/conta");
    router.refresh();
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-lg px-6 py-12">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
          Onboarding
        </h1>
        {step === "legal" ? (
          <div className="mt-8 space-y-6">
            <section>
              <h2 className="font-semibold text-[var(--cwg-graphite-900)]">
                {LEGAL_COPY.ageTitle}
              </h2>
              <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">
                {LEGAL_COPY.ageBody}
              </p>
              <label className="mt-3 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={age}
                  onChange={(e) => setAge(e.target.checked)}
                />
                <span>Tenho 18 anos ou mais</span>
              </label>
            </section>
            <section>
              <h2 className="font-semibold">{LEGAL_COPY.termsTitle}</h2>
              <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">
                {LEGAL_COPY.termsSummary}
              </p>
              <label className="mt-3 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                />
                <span>Aceito os Termos de Uso</span>
              </label>
            </section>
            <section>
              <h2 className="font-semibold">{LEGAL_COPY.privacyTitle}</h2>
              <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">
                {LEGAL_COPY.privacySummary}
              </p>
              <label className="mt-3 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={privacy}
                  onChange={(e) => setPrivacy(e.target.checked)}
                />
                <span>Aceito a Política de Privacidade</span>
              </label>
            </section>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <button
              type="button"
              disabled={loading}
              onClick={() => void finishLegal()}
              className="rounded-[10px] bg-[var(--cwg-green)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              Continuar
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-[var(--cwg-text-secondary)]">
              Como você quer usar o CWG?
            </p>
            {INTENTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIntent(item.id)}
                className={`w-full rounded-[10px] border px-4 py-3 text-left ${
                  intent === item.id
                    ? "border-[var(--cwg-green)] bg-[var(--cwg-green)]/10"
                    : "border-[var(--cwg-graphite-200)] bg-white"
                }`}
              >
                <div className="font-semibold text-[var(--cwg-graphite-900)]">
                  {item.title}
                </div>
                <div className="mt-1 text-sm text-[var(--cwg-text-secondary)]">
                  {item.body}
                </div>
              </button>
            ))}
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <button
              type="button"
              disabled={loading}
              onClick={() => void finishRoles()}
              className="rounded-[10px] bg-[var(--cwg-green)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              Concluir
            </button>
            <button
              type="button"
              className="ml-3 text-sm text-[var(--cwg-text-secondary)]"
              onClick={() => {
                clearDemoSessionClient();
                router.push("/entrar");
              }}
            >
              Cancelar
            </button>
          </div>
        )}
      </main>
    </>
  );
}
