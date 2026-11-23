"use client";

import Link from "next/link";
import { useState } from "react";
import { passwordRecoverySchema } from "@cwg/validation";
import { requestPasswordRecovery } from "@cwg/api";

import { createClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv } from "@/lib/env";

export default function RecoverPage() {
  const { configured } = getPublicSupabaseEnv();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const parsed = passwordRecoverySchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "E-mail inválido");
      return;
    }
    if (!configured) {
      setInfo(
        "Modo demonstração: use Entrar com ana@demo.cwg / carlos@demo.cwg / admin@demo.cwg (senha demo1234).",
      );
      return;
    }
    const client = createClient();
    if (!client) {
      setError("Cliente indisponível");
      return;
    }
    setLoading(true);
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/entrar`
        : undefined;
    const { error: authError } = await requestPasswordRecovery(
      client,
      parsed.data.email,
      redirectTo,
    );
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setInfo("Se o e-mail existir, enviamos o link de recuperação.");
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
        Recuperar senha
      </h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="text-[var(--cwg-text-secondary)]">E-mail</span>
          <input
            type="email"
            className="mt-1 w-full rounded-[10px] border border-[var(--cwg-graphite-200)] bg-white px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {info ? <p className="text-sm text-[var(--cwg-green)]">{info}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[10px] bg-[var(--cwg-green)] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Enviando…" : "Enviar link"}
        </button>
      </form>
      <p className="mt-6 text-sm">
        <Link href="/entrar" className="text-[var(--cwg-green)] hover:underline">
          Voltar
        </Link>
      </p>
    </div>
  );
}
