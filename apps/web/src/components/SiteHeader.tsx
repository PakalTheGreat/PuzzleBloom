import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--cwg-graphite-100)] bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-fraunces)] text-xl text-[var(--cwg-green-deep)]"
        >
          CWG
        </Link>
        <nav className="flex items-center gap-4 text-sm text-[var(--cwg-text-secondary)]">
          <Link href="/tecnicos" className="hover:text-[var(--cwg-green)]">
            Especialistas
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
