import Link from "next/link";

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

/**
 * Phase 1 stub — later loads specialist_profiles by slug from Supabase.
 * No exact cultivation addresses; badge/status only for verification.
 */
export default async function TecnicoPublicPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-[var(--cwg-surface-page)]">
      <header className="border-b border-[var(--cwg-graphite-100)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-fraunces)] text-xl text-[var(--cwg-green-deep)]"
          >
            CWG
          </Link>
          <span className="text-xs uppercase tracking-wide text-[var(--cwg-text-secondary)]">
            Perfil público
          </span>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--cwg-green)]/15 text-2xl font-semibold text-[var(--cwg-green-deep)]">
          {slug.slice(0, 2).toUpperCase()}
        </div>
        <h1 className="mt-6 font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-graphite-900)]">
          /tecnicos/{slug}
        </h1>
        <p className="mt-2 text-[var(--cwg-text-secondary)]">
          Stub Phase 1 — quando o Supabase estiver linkado, este slug carrega
          headline, região, especialidades e status de verificação (badge
          apenas).
        </p>
        <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--cwg-text-secondary)]">Verificação</dt>
            <dd className="mt-1 font-medium text-[var(--cwg-graphite-900)]">
              Não verificado (stub)
            </dd>
          </div>
          <div>
            <dt className="text-[var(--cwg-text-secondary)]">Atendimento</dt>
            <dd className="mt-1 font-medium text-[var(--cwg-graphite-900)]">
              Remoto · Presencial
            </dd>
          </div>
        </dl>
        <p className="mt-10 text-xs text-[var(--cwg-graphite-400)]">
          O selo de verificação não constitui endosso governamental.
        </p>
      </article>
    </main>
  );
}
