import Link from "next/link";
import { CONFIG_MISSING_MESSAGE_PT, exploreSpecialists } from "@cwg/api";

import { ConfigBanner } from "@/components/ConfigBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublicSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{ estado?: string; q?: string }>;

export const metadata = {
  title: "Especialistas",
  description: "Diretório público de especialistas técnicos CWG.",
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { configured } = getPublicSupabaseEnv();

  let rows: Array<Record<string, unknown>> = [];
  let fetchError: string | null = null;

  if (configured) {
    const client = await createClient();
    if (client) {
      const { data, error } = await exploreSpecialists(client, {
        state: params.estado,
        q: params.q,
      });
      if (error) fetchError = error.message;
      rows = (data as Array<Record<string, unknown>> | null) ?? [];
    }
  }

  return (
    <>
      <ConfigBanner />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
          Especialistas
        </h1>
        <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">
          Diretório público — reputação e verificação vêm do banco, nunca de
          assinatura.
        </p>

        <form className="mt-8 flex flex-wrap gap-3" method="get">
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Buscar"
            className="rounded-[10px] border border-[var(--cwg-graphite-200)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="estado"
            defaultValue={params.estado ?? ""}
            placeholder="UF"
            maxLength={2}
            className="w-20 rounded-[10px] border border-[var(--cwg-graphite-200)] bg-white px-3 py-2 text-sm uppercase"
          />
          <button
            type="submit"
            className="rounded-[10px] bg-[var(--cwg-green)] px-4 py-2 text-sm font-semibold text-white"
          >
            Filtrar
          </button>
        </form>

        {!configured ? (
          <p className="mt-8 text-sm text-[var(--cwg-text-secondary)]">
            {CONFIG_MISSING_MESSAGE_PT}
          </p>
        ) : fetchError ? (
          <p className="mt-8 text-sm text-red-700">{fetchError}</p>
        ) : rows.length === 0 ? (
          <p className="mt-8 text-sm text-[var(--cwg-text-secondary)]">
            Nenhum especialista encontrado. Com seed + perfis ativos, a lista
            aparece aqui.
          </p>
        ) : (
          <ul className="mt-8 space-y-4">
            {rows.map((row) => {
              const users = row.users as { full_name?: string } | null;
              const slug = String(row.slug);
              return (
                <li
                  key={String(row.id)}
                  className="border-b border-[var(--cwg-graphite-100)] pb-4"
                >
                  <Link
                    href={`/tecnicos/${slug}`}
                    className="font-semibold text-[var(--cwg-graphite-900)] hover:text-[var(--cwg-green)]"
                  >
                    {users?.full_name || slug}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--cwg-text-secondary)]">
                    {[row.headline, row.city, row.state]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-[var(--cwg-graphite-400)]">
                    {String(row.verification_status)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
