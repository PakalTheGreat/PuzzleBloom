import Link from "next/link";
import { CONFIG_MISSING_MESSAGE_PT } from "@cwg/api";

import { ConfigBanner } from "@/components/ConfigBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublicSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const { configured } = getPublicSupabaseEnv();
  let isAdmin = false;
  let pending: Array<Record<string, unknown>> = [];
  let note = CONFIG_MISSING_MESSAGE_PT;

  if (configured) {
    const client = await createClient();
    if (client) {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) {
        note = "Faça login com uma conta admin.";
      } else {
        const { data: roles } = await client
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin");
        isAdmin = (roles?.length ?? 0) > 0;
        if (!isAdmin) {
          note = "Acesso restrito a administradores (user_roles.admin).";
        } else {
          const { data } = await client
            .from("verification_requests")
            .select("id, user_id, role_context, status, submitted_at, legal_category")
            .eq("status", "pending_review")
            .order("submitted_at", { ascending: true })
            .limit(50);
          pending = (data as Array<Record<string, unknown>> | null) ?? [];
          note = "";
        }
      }
    }
  }

  return (
    <>
      <ConfigBanner />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
          Admin
        </h1>
        <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">
          Fila de verificação e moderação básica (Phase 4). RLS no backend.
        </p>
        {note ? (
          <p className="mt-8 text-sm text-[var(--cwg-text-secondary)]">{note}</p>
        ) : (
          <section className="mt-8">
            <h2 className="font-semibold">Verificações pendentes</h2>
            {pending.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--cwg-text-secondary)]">
                Nenhuma solicitação pending_review.
              </p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm">
                {pending.map((row) => (
                  <li
                    key={String(row.id)}
                    className="border-b border-[var(--cwg-graphite-100)] pb-3"
                  >
                    <div className="font-medium">{String(row.id)}</div>
                    <div className="text-[var(--cwg-text-secondary)]">
                      {String(row.role_context)} · {String(row.legal_category ?? "—")} ·{" "}
                      {String(row.submitted_at)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        <p className="mt-10 text-xs text-[var(--cwg-graphite-400)]">
          LGPD: documentos privados; exclusão via account_deletion_requests;
          revisão jurídica antes de produção.{" "}
          <Link href="/docs/lgpd" className="text-[var(--cwg-green)]">
            Notas
          </Link>
        </p>
      </main>
    </>
  );
}
