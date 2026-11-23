"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { readDemoSessionClient } from "@/lib/demo/client-session";
import { DEMO_ADMIN_PENDING, DEMO_ADMIN_REPORTS } from "@/lib/demo/data";
import { createClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv } from "@/lib/env";

type Pending = {
  id: string;
  user_id: string;
  role_context: string;
  status: string;
  submitted_at: string;
  legal_category: string | null;
};

type Report = {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  review_id?: string;
  reporter_user_id?: string;
};

export default function AdminPage() {
  const { configured } = getPublicSupabaseEnv();
  const [isAdmin, setIsAdmin] = useState(false);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const reload = useCallback(async () => {
    if (!configured) {
      const session = readDemoSessionClient();
      if (!session?.roles.includes("admin")) {
        setIsAdmin(false);
        setNote("Acesso restrito a administradores.");
        return;
      }
      setIsAdmin(true);
      setNote("");
      setPending([...DEMO_ADMIN_PENDING]);
      setReports([...DEMO_ADMIN_REPORTS]);
      return;
    }
    const client = createClient();
    if (!client) return;
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) {
      setNote("Faça login com uma conta admin.");
      setIsAdmin(false);
      return;
    }
    const { data: roles } = await client
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");
    const ok = (roles?.length ?? 0) > 0;
    setIsAdmin(ok);
    if (!ok) {
      setNote("Acesso restrito a administradores (user_roles.admin).");
      return;
    }
    setNote("");
    const [{ data: p }, { data: r }] = await Promise.all([
      client
        .from("verification_requests")
        .select("id, user_id, role_context, status, submitted_at, legal_category")
        .eq("status", "pending_review")
        .order("submitted_at", { ascending: true })
        .limit(50),
      client
        .from("review_reports")
        .select("id, reason, status, created_at, review_id, reporter_user_id")
        .eq("status", "open")
        .order("created_at", { ascending: true })
        .limit(50),
    ]);
    setPending((p as Pending[]) ?? []);
    setReports((r as Report[]) ?? []);
  }, [configured]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function decide(requestId: string, decision: "verified" | "rejected") {
    setError(null);
    setInfo(null);
    if (!configured) {
      setPending((prev) => prev.filter((row) => row.id !== requestId));
      setInfo(`Solicitação ${decision} (demo).`);
      setReason("");
      return;
    }
    const client = createClient();
    if (!client) return;
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return;

    const { data: req } = await client
      .from("verification_requests")
      .select("*")
      .eq("id", requestId)
      .single();
    if (!req) return;

    const { error: revErr } = await client.from("verification_reviews").insert({
      request_id: requestId,
      reviewer_id: user.id,
      decision,
      reason: reason || null,
    });
    if (revErr) {
      setError(revErr.message);
      return;
    }

    const { error: updErr } = await client
      .from("verification_requests")
      .update({
        status: decision,
        decided_at: new Date().toISOString(),
      })
      .eq("id", requestId);
    if (updErr) {
      setError(updErr.message);
      return;
    }

    if (req.role_context === "specialist") {
      await client
        .from("specialist_profiles")
        .update({ verification_status: decision })
        .eq("user_id", req.user_id);
    }

    await client.from("verification_status_history").insert({
      user_id: req.user_id,
      from_status: "pending_review",
      to_status: decision,
      actor_id: user.id,
      note: reason || null,
    });

    setInfo(`Solicitação ${decision}.`);
    setReason("");
    await reload();
  }

  async function resolveReport(reportId: string, action: "dismissed" | "actioned") {
    if (!configured) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      setInfo(`Report ${action} (demo).`);
      return;
    }
    const client = createClient();
    if (!client) return;
    const {
      data: { user },
    } = await client.auth.getUser();
    const { error: err } = await client
      .from("review_reports")
      .update({ status: action })
      .eq("id", reportId);
    if (err) {
      setError(err.message);
      return;
    }
    if (user) {
      const { data: rep } = await client
        .from("review_reports")
        .select("review_id")
        .eq("id", reportId)
        .maybeSingle();
      if (rep?.review_id) {
        await client.from("review_moderation_events").insert({
          review_id: rep.review_id,
          actor_id: user.id,
          action,
          note: reason || null,
        });
      }
    }
    setInfo(`Report ${action}.`);
    await reload();
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
          Admin
        </h1>
        <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">
          Fila de verificação e moderação.
        </p>
        <div className="mt-4 flex gap-3 text-sm">
          <Link href="/admin/entitlements" className="text-[var(--cwg-green)]">
            Entitlements
          </Link>
          <Link href="/docs/lgpd" className="text-[var(--cwg-green)]">
            LGPD
          </Link>
        </div>

        {note ? (
          <p className="mt-8 text-sm text-[var(--cwg-text-secondary)]">{note}</p>
        ) : null}
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        {info ? <p className="mt-4 text-sm text-[var(--cwg-green)]">{info}</p> : null}

        {isAdmin ? (
          <>
            <label className="mt-6 block text-sm">
              Motivo (opcional)
              <input
                className="mt-1 w-full rounded border px-2 py-1"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>

            <section className="mt-8">
              <h2 className="font-semibold">Verificações pendentes</h2>
              {pending.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--cwg-text-secondary)]">
                  Nenhuma pending_review.
                </p>
              ) : (
                <ul className="mt-4 space-y-4 text-sm">
                  {pending.map((row) => (
                    <li
                      key={row.id}
                      className="rounded-[10px] border border-[var(--cwg-graphite-100)] bg-white/80 p-4"
                    >
                      <div className="font-medium">{row.id}</div>
                      <div className="text-[var(--cwg-text-secondary)]">
                        {row.role_context} · {row.legal_category ?? "—"} ·{" "}
                        {new Date(row.submitted_at).toLocaleString("pt-BR")}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void decide(row.id, "verified")}
                          className="rounded bg-[var(--cwg-green)] px-3 py-1 text-xs font-semibold text-white"
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => void decide(row.id, "rejected")}
                          className="rounded border px-3 py-1 text-xs"
                        >
                          Rejeitar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-10">
              <h2 className="font-semibold">Reports de reviews abertos</h2>
              {reports.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--cwg-text-secondary)]">Nenhum report.</p>
              ) : (
                <ul className="mt-4 space-y-4 text-sm">
                  {reports.map((row) => (
                    <li
                      key={row.id}
                      className="rounded-[10px] border border-[var(--cwg-graphite-100)] bg-white/80 p-4"
                    >
                      <div className="font-medium">{row.reason}</div>
                      <div className="text-[var(--cwg-text-secondary)]">
                        {row.id} · {new Date(row.created_at).toLocaleString("pt-BR")}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void resolveReport(row.id, "dismissed")}
                          className="rounded border px-3 py-1 text-xs"
                        >
                          Dispensar
                        </button>
                        <button
                          type="button"
                          onClick={() => void resolveReport(row.id, "actioned")}
                          className="rounded bg-[var(--cwg-green)] px-3 py-1 text-xs font-semibold text-white"
                        >
                          Registrar ação
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}
