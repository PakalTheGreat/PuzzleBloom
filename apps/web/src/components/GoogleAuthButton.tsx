"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signInWithGoogle } from "@cwg/api";
import { DEMO_PERSONAS } from "@cwg/demo";

import { writeDemoSessionClient } from "@/lib/demo/client-session";
import { cultivationAcceptanceForSession } from "@/lib/legal-auth";
import { createClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv } from "@/lib/env";

type Props = {
  mode?: "signin" | "signup";
};

export function GoogleAuthButton({ mode = "signin" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/conta";
  const { configured } = getPublicSupabaseEnv();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDemo, setConfirmDemo] = useState(false);

  async function continueDemoGoogle() {
    setLoading(true);
    setError(null);
    const session = {
      ...DEMO_PERSONAS.google.session,
      legalAcceptances: cultivationAcceptanceForSession(),
    };
    const res = await fetch("/api/demo/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Falha no login Google (demo).");
      return;
    }
    writeDemoSessionClient(session);
    router.push(session.onboardingComplete ? next : "/onboarding");
    router.refresh();
  }

  async function onClick() {
    setError(null);
    if (!configured) {
      setConfirmDemo(true);
      return;
    }
    const client = createClient();
    if (!client) {
      setError("Cliente indisponível");
      return;
    }
    const site =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      window.location.origin;
    setLoading(true);
    const { data, error: oauthError } = await signInWithGoogle(client, {
      redirectTo: `${site}/auth/callback?next=${encodeURIComponent(next)}`,
    });
    setLoading(false);
    if (oauthError) {
      setError(oauthError.message);
      return;
    }
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={loading}
        onClick={() => void onClick()}
        data-testid="google-auth-button"
        className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[var(--cwg-graphite-200)] bg-white py-2.5 text-sm font-semibold text-[var(--cwg-graphite-900)] hover:border-[var(--cwg-green)] disabled:opacity-60"
      >
        <GoogleGlyph />
        {loading
          ? "Abrindo Google…"
          : mode === "signup"
            ? "Continuar com Google"
            : "Continuar com Google"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {confirmDemo ? (
        <div
          role="dialog"
          aria-modal="true"
          className="rounded-[10px] border border-[var(--cwg-graphite-200)] bg-[var(--cwg-graphite-50)] p-4"
          data-testid="google-demo-consent"
        >
          <p className="text-sm text-[var(--cwg-text)]">
            Modo demonstração: simularemos o consentimento Google e entraremos
            como <strong>{DEMO_PERSONAS.google.email}</strong>.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => void continueDemoGoogle()}
              className="rounded-[8px] bg-[var(--cwg-green)] px-3 py-2 text-sm font-semibold text-white"
            >
              Simular consentimento
            </button>
            <button
              type="button"
              onClick={() => setConfirmDemo(false)}
              className="rounded-[8px] px-3 py-2 text-sm text-[var(--cwg-text-secondary)]"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.1 4 9.2 8.5 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.2 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.1 39.4 16 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.5 5.5-6.5 6.6l6.2 5.2C38.7 36.8 44 31.2 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}
