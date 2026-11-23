"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signInSchema } from "@cwg/validation";
import { signInWithEmail } from "@cwg/api";

import { DEMO_PERSONAS, type DemoPersona } from "@/lib/demo/data";
import { writeDemoSessionClient } from "@/lib/demo/client-session";
import { createClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv } from "@/lib/env";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/conta";
  const { configured } = getPublicSupabaseEnv();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function enterDemo(persona: DemoPersona) {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/demo/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona }),
    });
    const json = (await res.json()) as { error?: string; session?: (typeof DEMO_PERSONAS)[DemoPersona]["session"] };
    setLoading(false);
    if (!res.ok || !json.session) {
      setError(json.error ?? "Falha no login demonstração");
      return;
    }
    writeDemoSessionClient(json.session);
    router.push(next);
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!configured) {
      setLoading(true);
      const res = await fetch("/api/demo/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json()) as {
        error?: string;
        session?: (typeof DEMO_PERSONAS)[DemoPersona]["session"];
      };
      setLoading(false);
      if (!res.ok || !json.session) {
        setError(json.error ?? "Use ana@demo.cwg / demo1234 ou os atalhos abaixo.");
        return;
      }
      writeDemoSessionClient(json.session);
      router.push(next);
      router.refresh();
      return;
    }

    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    const client = createClient();
    if (!client) {
      setError("Cliente indisponível");
      return;
    }
    setLoading(true);
    const { error: authError } = await signInWithEmail(client, parsed.data);
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
        Entrar
      </h1>
      <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">
        {configured
          ? "Acesse sua conta CWG (e-mail e senha)."
          : "Protótipo em modo demonstração — escolha um perfil ou use as contas demo."}
      </p>

      {!configured ? (
        <div className="mt-6 grid gap-2">
          {(Object.keys(DEMO_PERSONAS) as DemoPersona[]).map((key) => (
            <button
              key={key}
              type="button"
              disabled={loading}
              onClick={() => void enterDemo(key)}
              className="rounded-[10px] border border-[var(--cwg-graphite-200)] bg-white px-4 py-3 text-left text-sm hover:border-[var(--cwg-green)] disabled:opacity-60"
            >
              <div className="font-semibold text-[var(--cwg-graphite-900)]">
                {DEMO_PERSONAS[key].label}
              </div>
              <div className="text-[var(--cwg-text-secondary)]">
                {DEMO_PERSONAS[key].email}
              </div>
            </button>
          ))}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="text-[var(--cwg-text-secondary)]">E-mail</span>
          <input
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded-[10px] border border-[var(--cwg-graphite-200)] bg-white px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={!configured ? "ana@demo.cwg" : undefined}
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
            placeholder={!configured ? "demo1234" : undefined}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--cwg-text-secondary)]">Carregando…</p>}>
      <LoginForm />
    </Suspense>
  );
}
