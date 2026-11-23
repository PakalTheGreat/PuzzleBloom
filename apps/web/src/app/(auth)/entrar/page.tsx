"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInSchema } from "@cwg/validation";
import { CONFIG_MISSING_MESSAGE_PT, signInWithEmail } from "@cwg/api";

import { createClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv } from "@/lib/env";

export default function LoginPage() {
  const router = useRouter();
  const { configured } = getPublicSupabaseEnv();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!configured) {
      setError(CONFIG_MISSING_MESSAGE_PT);
      return;
    }
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    const client = createClient();
    if (!client) {
      setError(CONFIG_MISSING_MESSAGE_PT);
      return;
    }
    setLoading(true);
    const { error: authError } = await signInWithEmail(client, parsed.data);
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.push("/conta");
    router.refresh();
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
        Entrar
      </h1>
      <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">
        Acesse sua conta CWG (e-mail e senha).
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="text-[var(--cwg-text-secondary)]">E-mail</span>
          <input
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded-[10px] border border-[var(--cwg-graphite-200)] bg-white px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--cwg-text-secondary)]">Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-[10px] border border-[var(--cwg-graphite-200)] bg-white px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[10px] bg-[var(--cwg-green)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--cwg-green-deep)] disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="mt-6 text-sm text-[var(--cwg-text-secondary)]">
        <Link href="/recuperar" className="text-[var(--cwg-green)] hover:underline">
          Esqueci a senha
        </Link>
        {" · "}
        <Link href="/cadastrar" className="text-[var(--cwg-green)] hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
