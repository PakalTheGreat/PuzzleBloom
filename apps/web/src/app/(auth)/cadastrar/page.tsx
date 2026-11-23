"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUpSchema } from "@cwg/validation";
import { CONFIG_MISSING_MESSAGE_PT, signUpWithEmail } from "@cwg/api";

import { createClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv } from "@/lib/env";

export default function SignUpPage() {
  const router = useRouter();
  const { configured } = getPublicSupabaseEnv();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!configured) {
      setError(CONFIG_MISSING_MESSAGE_PT);
      return;
    }
    const parsed = signUpSchema.safeParse({
      email,
      password,
      full_name: fullName,
    });
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
    const { data, error: authError } = await signUpWithEmail(client, parsed.data);
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    if (data.session) {
      router.push("/onboarding");
      router.refresh();
      return;
    }
    setInfo(
      "Conta criada. Verifique seu e-mail para confirmar, depois entre e conclua o onboarding.",
    );
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
        Criar conta
      </h1>
      <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">
        Cadastro com e-mail e senha. Google OAuth fica para depois.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="text-[var(--cwg-text-secondary)]">Nome completo</span>
          <input
            className="mt-1 w-full rounded-[10px] border border-[var(--cwg-graphite-200)] bg-white px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </label>
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
        <label className="block text-sm">
          <span className="text-[var(--cwg-text-secondary)]">Senha</span>
          <input
            type="password"
            className="mt-1 w-full rounded-[10px] border border-[var(--cwg-graphite-200)] bg-white px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {info ? <p className="text-sm text-[var(--cwg-green)]">{info}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[10px] bg-[var(--cwg-green)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--cwg-green-deep)] disabled:opacity-60"
        >
          {loading ? "Criando…" : "Cadastrar"}
        </button>
      </form>
      <p className="mt-6 text-sm">
        <Link href="/entrar" className="text-[var(--cwg-green)] hover:underline">
          Já tenho conta
        </Link>
      </p>
    </div>
  );
}
