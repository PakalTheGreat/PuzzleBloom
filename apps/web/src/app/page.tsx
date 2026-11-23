import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,61,46,0.92),rgba(20,24,31,0.88))]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(61,155,116,0.35), transparent 40%), radial-gradient(circle at 80% 70%, rgba(244,246,248,0.08), transparent 35%)",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16 text-white">
        <p className="font-[family-name:var(--font-fraunces)] text-4xl tracking-tight sm:text-6xl">
          CWG
        </p>
        <h1 className="mt-4 max-w-2xl text-2xl font-medium leading-snug text-white/95 sm:text-3xl">
          Connect With Growers
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
          Encontre especialistas técnicos verificados — ou ofereça seus
          serviços profissionais. Mobile-first, reputação real, sem marketplace
          de produtos.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/tecnicos"
            className="rounded-[10px] bg-[var(--cwg-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--cwg-graphite-950)] transition hover:brightness-110"
          >
            Ver especialistas
          </Link>
          <Link
            href="/entrar"
            className="rounded-[10px] border border-white/25 px-5 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
          >
            Entrar na demo
          </Link>
          <Link
            href="/cadastrar"
            className="rounded-[10px] border border-white/25 px-5 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
          >
            Criar conta
          </Link>
        </div>
      </div>

      <section
        id="sobre"
        className="relative z-10 border-t border-white/10 bg-[var(--cwg-graphite-50)] px-6 py-16 text-[var(--cwg-text)]"
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--cwg-green-deep)]">
            Profissional, não recreativo
          </h2>
          <p className="mt-3 text-[var(--cwg-text-secondary)]">
            CWG conecta cultivadores e organizações legalmente autorizados a
            especialistas técnicos no Brasil. Agenda, CRM e reputação baseada em
            confirmações mútuas — nunca ranking pago disfarçado.
          </p>
        </div>
      </section>
    </main>
  );
}
