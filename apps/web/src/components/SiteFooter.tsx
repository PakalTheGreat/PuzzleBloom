import Link from "next/link";

import { PlayStoreButton } from "@/components/PlayStoreButton";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--cwg-graphite-100)] bg-[var(--cwg-graphite-50)] px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-[family-name:var(--font-fraunces)] text-lg text-[var(--cwg-green-deep)]">
            CWG
          </p>
          <p className="mt-1 text-sm text-[var(--cwg-text-secondary)]">
            Connect With Growers — serviços profissionais, sem marketplace de
            produtos.
          </p>
          <p className="mt-2 text-xs text-[var(--cwg-text-secondary)]">
            <Link href="/docs/lgpd" className="underline hover:text-[var(--cwg-green)]">
              Termos e Privacidade
            </Link>
          </p>
        </div>
        <PlayStoreButton variant="dark" />
      </div>
    </footer>
  );
}
