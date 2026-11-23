"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  CONFIG_MISSING_MESSAGE_PT,
  addCrmNote,
  addCrmServiceRecord,
  completeCrmTask,
  createCrmTask,
  getCrmClient,
  listCrmNotes,
  listCrmServiceHistory,
  listCrmTasks,
  updateCrmClient,
} from "@cwg/api";

import { ConfigBanner } from "@/components/ConfigBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv } from "@/lib/env";

export default function CrmDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { configured } = getPublicSupabaseEnv();
  const [clientRow, setClientRow] = useState<Record<string, unknown> | null>(null);
  const [notes, setNotes] = useState<Array<Record<string, unknown>>>([]);
  const [tasks, setTasks] = useState<Array<Record<string, unknown>>>([]);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [note, setNote] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [serviceSummary, setServiceSummary] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!configured || !id) return;
    const client = createClient();
    if (!client) return;
    const { data: c, error: cErr } = await getCrmClient(client, id);
    if (cErr || !c) {
      setError(cErr?.message ?? "Cliente não encontrado");
      return;
    }
    setClientRow(c as Record<string, unknown>);
    const spId = c.specialist_profile_id as string;
    const [n, t, h] = await Promise.all([
      listCrmNotes(client, id),
      listCrmTasks(client, spId, id),
      listCrmServiceHistory(client, id),
    ]);
    if (n.error) setError(n.error.message);
    else setNotes((n.data as Array<Record<string, unknown>>) ?? []);
    if (t.error) setError(t.error.message);
    else setTasks((t.data as Array<Record<string, unknown>>) ?? []);
    if (h.error) setError(h.error.message);
    else setHistory((h.data as Array<Record<string, unknown>>) ?? []);
  }, [configured, id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function saveStatus(status: string) {
    const client = createClient();
    if (!client || !id) return;
    await updateCrmClient(client, id, { status });
    await reload();
  }

  async function addNote() {
    if (!note.trim() || !id) return;
    const client = createClient();
    if (!client) return;
    const { error: err } = await addCrmNote(client, id, note.trim());
    if (err) setError(err.message);
    else {
      setNote("");
      await reload();
    }
  }

  async function addTask() {
    if (!taskTitle.trim() || !clientRow) return;
    const client = createClient();
    if (!client) return;
    const { error: err } = await createCrmTask(client, {
      specialist_profile_id: clientRow.specialist_profile_id as string,
      crm_client_id: id,
      title: taskTitle.trim(),
    });
    if (err) setError(err.message);
    else {
      setTaskTitle("");
      await reload();
    }
  }

  async function addHistory() {
    if (!serviceSummary.trim() || !id) return;
    const client = createClient();
    if (!client) return;
    const { error: err } = await addCrmServiceRecord(client, {
      crm_client_id: id,
      summary: serviceSummary.trim(),
      occurred_on: new Date().toISOString().slice(0, 10),
    });
    if (err) setError(err.message);
    else {
      setServiceSummary("");
      await reload();
    }
  }

  return (
    <>
      <ConfigBanner />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/crm" className="text-sm text-[var(--cwg-green)]">
          ← CRM
        </Link>
        {!configured ? (
          <p className="mt-8 text-sm">{CONFIG_MISSING_MESSAGE_PT}</p>
        ) : !clientRow ? (
          <p className="mt-8 text-sm">{error || "Carregando…"}</p>
        ) : (
          <>
            <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
              {String(clientRow.display_name)}
            </h1>
            <p className="mt-1 text-sm text-[var(--cwg-text-secondary)]">
              {String(clientRow.status)} · {String(clientRow.email ?? "—")} ·{" "}
              {String(clientRow.phone ?? "—")}
            </p>
            {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {(["lead", "active", "inactive", "archived"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void saveStatus(s)}
                  className="rounded border px-2 py-1"
                >
                  {s}
                </button>
              ))}
            </div>

            <section className="mt-10">
              <h2 className="font-semibold">Notas privadas</h2>
              <div className="mt-3 flex gap-2">
                <input
                  className="flex-1 rounded border px-2 py-1 text-sm"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nova nota"
                />
                <button
                  type="button"
                  onClick={() => void addNote()}
                  className="rounded bg-[var(--cwg-green)] px-3 py-1 text-sm text-white"
                >
                  Salvar
                </button>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {notes.map((n) => (
                  <li key={String(n.id)} className="border-b border-[var(--cwg-graphite-100)] pb-2">
                    {String(n.body)}
                    <div className="text-xs text-[var(--cwg-graphite-400)]">
                      {n.created_at ? new Date(String(n.created_at)).toLocaleString("pt-BR") : ""}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10">
              <h2 className="font-semibold">Tarefas</h2>
              <div className="mt-3 flex gap-2">
                <input
                  className="flex-1 rounded border px-2 py-1 text-sm"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Nova tarefa"
                />
                <button
                  type="button"
                  onClick={() => void addTask()}
                  className="rounded bg-[var(--cwg-green)] px-3 py-1 text-sm text-white"
                >
                  Criar
                </button>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {tasks.map((t) => (
                  <li
                    key={String(t.id)}
                    className="flex items-center justify-between border-b border-[var(--cwg-graphite-100)] pb-2"
                  >
                    <span className={t.done_at ? "line-through opacity-60" : ""}>
                      {String(t.title)}
                    </span>
                    {!t.done_at ? (
                      <button
                        type="button"
                        className="text-xs text-[var(--cwg-green)]"
                        onClick={async () => {
                          const client = createClient();
                          if (!client) return;
                          await completeCrmTask(client, String(t.id));
                          await reload();
                        }}
                      >
                        Concluir
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10">
              <h2 className="font-semibold">Histórico de serviços</h2>
              <div className="mt-3 flex gap-2">
                <input
                  className="flex-1 rounded border px-2 py-1 text-sm"
                  value={serviceSummary}
                  onChange={(e) => setServiceSummary(e.target.value)}
                  placeholder="Resumo do atendimento"
                />
                <button
                  type="button"
                  onClick={() => void addHistory()}
                  className="rounded bg-[var(--cwg-green)] px-3 py-1 text-sm text-white"
                >
                  Registrar
                </button>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {history.map((h) => (
                  <li key={String(h.id)} className="border-b border-[var(--cwg-graphite-100)] pb-2">
                    {String(h.summary)}
                    <div className="text-xs text-[var(--cwg-graphite-400)]">
                      {String(h.occurred_on ?? "")}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </>
  );
}
