import Link from "next/link";
import { redirect } from "next/navigation";
import { CONFIG_MISSING_MESSAGE_PT, fetchMe } from "@cwg/api";

import { ConfigBanner } from "@/components/ConfigBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublicSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./SignOutButton";

export default async function ContaPage() {
  const { configured } = getPublicSupabaseEnv();
  if (!configured) {
    return (
      <>
        <ConfigBanner />
        <SiteHeader />
        <main className="mx-auto max-w-lg px-6 py-12">
          <p className="text-sm text-[var(--cwg-text-secondary)]">
            {CONFIG_MISSING_MESSAGE_PT}
          </p>
        </main>
      </>
    );
  }

  const client = await createClient();
  if (!client) redirect("/entrar");

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/entrar");

  const me = await fetchMe(client, user.id);
  if (!me.onboardingComplete) redirect("/onboarding");

  const specialist = me.specialist as { slug?: string } | null;

  return (
    <>
      <ConfigBanner />
      <SiteHeader />
      <main className="mx-auto max-w-lg px-6 py-12">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
          Minha conta
        </h1>
        <dl className="mt-8 space-y-3 text-sm">
          <div>
            <dt className="text-[var(--cwg-text-secondary)]">E-mail</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-[var(--cwg-text-secondary)]">Papéis</dt>
            <dd className="font-medium">{me.roles.join(", ") || "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--cwg-text-secondary)]">Papel ativo</dt>
            <dd className="font-medium">
              {(me.user as { active_role?: string } | null)?.active_role ?? "—"}
            </dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link href="/tecnicos" className="text-[var(--cwg-green)] hover:underline">
            Diretório
          </Link>
          {specialist?.slug ? (
            <Link
              href={`/tecnicos/${specialist.slug}`}
              className="text-[var(--cwg-green)] hover:underline"
            >
              Meu perfil público
            </Link>
          ) : null}
          <Link href="/admin" className="text-[var(--cwg-green)] hover:underline">
            Admin
          </Link>
        </div>
        <div className="mt-10">
          <SignOutButton />
        </div>
      </main>
    </>
  );
}
