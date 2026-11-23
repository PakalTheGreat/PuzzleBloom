import Link from "next/link";

import { SiteHeader } from "@/components/SiteHeader";

export const metadata = { title: "LGPD / segurança" };

export default function LgpdNotesPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-12 prose prose-neutral">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
          Segurança e LGPD (notas Phase 4)
        </h1>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-[var(--cwg-text-secondary)]">
          <li>RLS deny-by-default em tabelas privadas.</li>
          <li>Storage de verificação/CRM/mensagens com buckets privados + signed URLs.</li>
          <li>Sem endereços exatos de cultivo no schema público.</li>
          <li>Aceites versionados (Termos/Privacidade) + confirmação 18+.</li>
          <li>account_deletion_requests para fluxo LGPD.</li>
          <li>Assinaturas nunca alteram reputação/verificação.</li>
          <li>Revisão jurídica obrigatória antes do launch.</li>
        </ul>
        <Link href="/" className="mt-8 inline-block text-sm text-[var(--cwg-green)]">
          Voltar
        </Link>
      </main>
    </>
  );
}
