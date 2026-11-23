import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--cwg-graphite-100)] bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-fraunces)] text-xl text-[var(--cwg-green-deep)]"
        >
          CWG
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-[var(--cwg-text-secondary)]">
          <Link href="/tecnicos" className="hover:text-[var(--cwg-green)]">
            Especialistas
          </Link>
          <Link href="/favoritos" className="hover:text-[var(--cwg-green)]">
            Favoritos
          </Link>
          <Link href="/solicitacoes" className="hover:text-[var(--cwg-green)]">
            Solicitações
          </Link>
          <Link href="/agendamentos" className="hover:text-[var(--cwg-green)]">
            Agenda
          </Link>
          <Link href="/calendario" className="hover:text-[var(--cwg-green)]">
            Calendário
          </Link>
          <Link href="/crm" className="hover:text-[var(--cwg-green)]">
            CRM
          </Link>
          <Link href="/mensagens" className="hover:text-[var(--cwg-green)]">
            Mensagens
          </Link>
          <Link href="/entrar" className="hover:text-[var(--cwg-green)]">
            Entrar
          </Link>
          <Link
            href="/cadastrar"
            className="rounded-[10px] bg-[var(--cwg-green)] px-3 py-1.5 font-medium text-white hover:bg-[var(--cwg-green-deep)]"
          >
            Cadastrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
