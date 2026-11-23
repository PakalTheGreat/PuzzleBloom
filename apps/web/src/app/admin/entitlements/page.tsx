"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getEntitlement } from "@cwg/api";
import { ENTITLEMENTS, formatBrl } from "@cwg/shared";

import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv } from "@/lib/env";
import { getMySpecialistProfileId } from "@/lib/specialist";

type Plan = {
  id: string;
  code: string;
  name_pt: string;
  price_brl: number;
};

const DEMO_PLANS: Plan[] = [
  { id: "p1", code: "free", name_pt: "Essencial", price_brl: 0 },
  { id: "p2", code: "pro", name_pt: "Profissional", price_brl: 89 },
  { id: "p3", code: "org", name_pt: "Organização", price_brl: 249 },
];

const DEMO_FEATURES: Record<string, string> = {
  [ENTITLEMENTS.CRM_CLIENT_CAP]: "50",
  [ENTITLEMENTS.ANALYTICS_DEPTH]: "full",
  [ENTITLEMENTS.PORTFOLIO_ITEMS_CAP]: "20",
};

export default function EntitlementsPage() {
  const { configured } = getPublicSupabaseEnv();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      setPlans(DEMO_PLANS);
      setFeatures(DEMO_FEATURES);
      return;
    }
    const client = createClient();
    if (!client) return;
    void (async () => {
      const { data: planRows, error: pErr } = await client
        .from("subscription_plans")
        .select("id, code, name_pt, price_brl")
        .eq("is_active", true)
        .order("sort_order");
      if (pErr) setError(pErr.message);
      else setPlans((planRows as Plan[]) ?? []);

      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) return;
      const spId = await getMySpecialistProfileId(client, user.id);
      if (!spId) return;
      const entries = await Promise.all(
        Object.values(ENTITLEMENTS).map(async (key) => {
          const { data } = await getEntitlement(client, spId, key);
          return [key, data ?? "—"] as const;
        }),
      );
      setFeatures(Object.fromEntries(entries));
    })();
  }, [configured]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <Link href="/admin" className="text-sm text-[var(--cwg-green)]">
          ← Admin
        </Link>
        <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
          Planos e entitlements
        </h1>
        <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">
          Stub — preços hipotéticos. Assinatura nunca altera reputação, reviews
          ou verificação.
        </p>
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        <ul className="mt-8 space-y-3">
          {plans.map((p) => (
            <li
              key={p.id}
              className="rounded-[10px] border border-[var(--cwg-graphite-100)] bg-white/80 p-4"
            >
              <div className="font-semibold">
                {p.name_pt}{" "}
                <span className="text-[var(--cwg-text-secondary)]">({p.code})</span>
              </div>
              <div className="text-sm text-[var(--cwg-text-secondary)]">
                {formatBrl(Number(p.price_brl))}
              </div>
            </li>
          ))}
        </ul>
        <h2 className="mt-10 font-semibold">Seu plano ativo (resolvido)</h2>
        <dl className="mt-4 space-y-2 text-sm">
          {Object.entries(features).map(([k, v]) => (
            <div key={k} className="flex justify-between border-b py-2">
              <dt className="text-[var(--cwg-text-secondary)]">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </main>
    </>
  );
}
