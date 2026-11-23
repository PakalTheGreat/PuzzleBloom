import { exploreSpecialists } from "@cwg/api";
import { exploreDemoSpecialists } from "@cwg/demo";

import { DirectoryClient } from "@/components/DirectoryClient";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublicSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{
  estado?: string;
  cidade?: string;
  q?: string;
  mode?: string;
  lat?: string;
  lng?: string;
}>;

type DirectoryRow = {
  id: string;
  slug: string;
  headline?: string | null;
  city?: string | null;
  state?: string | null;
  verification_status?: string | null;
  offers_in_person?: boolean | null;
  offers_remote?: boolean | null;
  service_lat?: number | null;
  service_lng?: number | null;
  users?: { full_name?: string } | null;
  distance_km?: number | null;
};

export const metadata = {
  title: "Especialistas",
  description:
    "Diretório público de especialistas técnicos CWG — presencial por proximidade.",
};

function preferInPerson(rows: DirectoryRow[]): DirectoryRow[] {
  return [...rows].sort((a, b) => {
    const aIn = a.offers_in_person ? 0 : 1;
    const bIn = b.offers_in_person ? 0 : 1;
    if (aIn !== bIn) return aIn - bIn;
    return 0;
  });
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { configured } = getPublicSupabaseEnv();
  const mode =
    params.mode === "in_person" || params.mode === "remote"
      ? params.mode
      : "all";

  let rows: DirectoryRow[] = [];
  let fetchError: string | null = null;

  if (!configured) {
    rows = exploreDemoSpecialists({
      estado: params.estado,
      cidade: params.cidade,
      q: params.q,
      mode,
    }) as unknown as DirectoryRow[];
  } else {
    const client = await createClient();
    if (client) {
      const { data, error } = await exploreSpecialists(client, {
        state: params.estado,
        city: params.cidade,
        q: params.q,
        mode,
      });
      if (error) fetchError = error.message;
      rows = preferInPerson((data as DirectoryRow[] | null) ?? []);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
          Especialistas perto de você
        </h1>
        {fetchError ? (
          <p className="mt-8 text-sm text-red-700">{fetchError}</p>
        ) : (
          <DirectoryClient
            initialRows={rows}
            initialQuery={{
              q: params.q,
              estado: params.estado,
              cidade: params.cidade,
              mode,
              lat: params.lat,
              lng: params.lng,
            }}
          />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
