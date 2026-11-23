import Link from "next/link";
import { getSpecialistBySlug } from "@cwg/api";

import { FavoriteButton } from "@/components/FavoriteButton";
import { RequestServiceButton } from "@/components/RequestServiceButton";
import { SiteHeader } from "@/components/SiteHeader";
import { getDemoSpecialistBySlug } from "@/lib/demo/data";
import { getPublicSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: `Técnico · ${slug}`,
    description: `Perfil público do especialista ${slug} no CWG.`,
  };
}

export default async function TecnicoPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const { configured } = getPublicSupabaseEnv();

  let profile: Record<string, unknown> | null = null;
  let errorMsg: string | null = null;

  if (!configured) {
    profile = (getDemoSpecialistBySlug(slug) as Record<string, unknown> | null) ?? null;
  } else {
    const client = await createClient();
    if (client) {
      const { data, error } = await getSpecialistBySlug(client, slug);
      if (error) errorMsg = error.message;
      profile = (data as Record<string, unknown> | null) ?? null;
    }
  }

  const users = profile?.users as { full_name?: string; avatar_url?: string } | null;
  const specialties =
    (profile?.specialist_specialties as Array<{
      specialties?: { name_pt?: string };
    }> | null) ?? [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        {errorMsg ? (
          <p className="text-sm text-red-700">{errorMsg}</p>
        ) : !profile ? (
          <div>
            <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-graphite-900)]">
              Perfil não encontrado
            </h1>
            <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">
              Nenhum especialista com slug <code>{slug}</code>.
            </p>
            <Link href="/tecnicos" className="mt-6 inline-block text-[var(--cwg-green)]">
              Voltar ao diretório
            </Link>
          </div>
        ) : (
          <article>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--cwg-green)]/15 text-2xl font-semibold text-[var(--cwg-green-deep)]">
              {(users?.full_name || slug).slice(0, 2).toUpperCase()}
            </div>
            <h1 className="mt-6 font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-graphite-900)]">
              {users?.full_name || slug}
            </h1>
            {profile.headline ? (
              <p className="mt-2 text-lg text-[var(--cwg-text-secondary)]">
                {String(profile.headline)}
              </p>
            ) : null}
            <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--cwg-text-secondary)]">Verificação</dt>
                <dd className="mt-1 font-medium">
                  {String(profile.verification_status)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--cwg-text-secondary)]">Região</dt>
                <dd className="mt-1 font-medium">
                  {[profile.city, profile.state, profile.region]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--cwg-text-secondary)]">Atendimento</dt>
                <dd className="mt-1 font-medium">
                  {[
                    profile.offers_remote ? "Remoto" : null,
                    profile.offers_in_person ? "Presencial" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--cwg-text-secondary)]">Especialidades</dt>
                <dd className="mt-1 font-medium">
                  {specialties
                    .map((s) => s.specialties?.name_pt)
                    .filter(Boolean)
                    .join(", ") || "—"}
                </dd>
              </div>
            </dl>
            {profile.bio ? (
              <p className="mt-8 whitespace-pre-wrap text-[var(--cwg-text)]">
                {String(profile.bio)}
              </p>
            ) : null}
            <FavoriteButton specialistProfileId={String(profile.id)} />
            <RequestServiceButton specialistProfileId={String(profile.id)} />
            <p className="mt-10 text-xs text-[var(--cwg-graphite-400)]">
              O selo de verificação não constitui endosso governamental. Sem
              endereços de cultivo.
            </p>
          </article>
        )}
      </main>
    </>
  );
}
