import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchMe } from "@cwg/api";

import { SiteHeader } from "@/components/SiteHeader";
import { getAppSession, isDemoMode } from "@/lib/auth";
import type { AppRole } from "@/lib/demo/types";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./SignOutButton";
import { RoleSwitcher } from "./RoleSwitcher";

export default async function ContaPage() {
  if (isDemoMode()) {
    const session = await getAppSession();
    if (!session) redirect("/entrar?next=/conta");
    if (!session.onboardingComplete) redirect("/onboarding");

    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-lg px-6 py-12">
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
            Minha conta
          </h1>
          <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">
            Sessão de demonstração — dados locais, sem Supabase.
          </p>
          <dl className="mt-8 space-y-3 text-sm">
            <div>
              <dt className="text-[var(--cwg-text-secondary)]">Nome</dt>
              <dd className="font-medium">{session.fullName}</dd>
            </div>
            <div>
              <dt className="text-[var(--cwg-text-secondary)]">E-mail</dt>
              <dd className="font-medium">{session.email}</dd>
            </div>
            <div>
              <dt className="text-[var(--cwg-text-secondary)]">Papéis</dt>
              <dd className="font-medium">{session.roles.join(", ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--cwg-text-secondary)]">Papel ativo</dt>
              <dd className="font-medium">{session.activeRole}</dd>
            </div>
          </dl>
          {session.roles.length > 1 ? (
            <RoleSwitcher
              roles={session.roles as AppRole[]}
              activeRole={session.activeRole}
            />
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <Link href="/tecnicos" className="text-[var(--cwg-green)] hover:underline">
              Diretório
            </Link>
            {session.activeRole === "specialist" ? (
              <>
                <Link href="/crm" className="text-[var(--cwg-green)] hover:underline">
                  CRM
                </Link>
                <Link href="/calendario" className="text-[var(--cwg-green)] hover:underline">
                  Calendário
                </Link>
              </>
            ) : null}
            {session.activeRole === "grower" ? (
              <Link href="/favoritos" className="text-[var(--cwg-green)] hover:underline">
                Favoritos
              </Link>
            ) : null}
            {session.roles.includes("admin") ? (
              <Link href="/admin" className="text-[var(--cwg-green)] hover:underline">
                Admin
              </Link>
            ) : null}
          </div>
          <div className="mt-10">
            <SignOutButton />
          </div>
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
        </div>
        <div className="mt-10">
          <SignOutButton />
        </div>
      </main>
    </>
  );
}
