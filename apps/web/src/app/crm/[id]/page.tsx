"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
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

import { SiteHeader } from "@/components/SiteHeader";
import {
  DEMO_CRM_CLIENTS,
  DEMO_CRM_NOTES,
  DEMO_CRM_TASKS,
} from "@/lib/demo/data";
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
    if (!id) return;
    if (!configured) {
      const found = DEMO_CRM_CLIENTS.find((c) => c.id === id);
      if (!found) {
        setError("Cliente não encontrado");
        setClientRow(null);
        return;
      }
      setClientRow({ ...found });
      setNotes(DEMO_CRM_NOTES.filter((n) => n.client_id === id) as Array<Record<string, unknown>>);
      setTasks(DEMO_CRM_TASKS.filter((t) => t.client_id === id) as Array<Record<string, unknown>>);
      setHistory([
        {
          id: "hist-1",
          summary: "Consulta remota de SOP",
          occurred_on: "2026-11-10",
        },
      ]);
      setError(null);
      return;
    }
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
    if (!configured) {
      setClientRow((prev) => (prev ? { ...prev, status } : prev));
      return;
    }
    const client = createClient();
    if (!client || !id) return;
    await updateCrmClient(client, id, { status });
    await reload();
  }

  async function addNote() {
    if (!note.trim() || !id) return;
    if (!configured) {
      setNotes((prev) => [
        {
          id: `note-${Date.now()}`,
          client_id: id,
          body: note.trim(),
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setNote("");
      return;
    }
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
    if (!configured) {
      setTasks((prev) => [
        ...prev,
        {
          id: `task-${Date.now()}`,
          client_id: id,
          title: taskTitle.trim(),
          status: "open",
          due_at: null,
        },
      ]);
      setTaskTitle("");
      return;
    }
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
    if (!configured) {
      setHistory((prev) => [
        {
          id: `hist-${Date.now()}`,
          summary: serviceSummary.trim(),
          occurred_on: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ]);
      setServiceSummary("");
      return;
    }
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
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/crm" className="text-sm text-[var(--cwg-green)]">
          ← CRM
        </Link>
        {!clientRow ? (
          <p className="mt-8 text-sm">{error || "Carregando…"}</p>
        ) : (
          <>
            <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
              {String(clientRow.display_name)}
            </h1>
            <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">
              {String(clientRow.email || "—")} · {String(clientRow.phone || "—")}
            </p>
            {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {["lead", "active", "paused", "archived"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void saveStatus(s)}
                  className={`rounded-[10px] px-3 py-1 ${
                    clientRow.status === s
                      ? "bg-[var(--cwg-green)] text-white"
                      : "border"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {clientRow.notes ? (
              <p className="mt-6 text-sm text-[var(--cwg-text)]">{String(clientRow.notes)}</p>
            ) : null}

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
                  <li key={String(n.id)} className="border-b pb-2">
                    {String(n.body)}
                    <div className="text-xs text-[var(--cwg-graphite-400)]">
                      {n.created_at
                        ? new Date(String(n.created_at)).toLocaleString("pt-BR")
                        : ""}
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
                  <li key={String(t.id)} className="flex items-center justify-between gap-3">
                    <span>
                      {String(t.title)}{" "}
                      <span className="text-[var(--cwg-text-secondary)]">
                        ({String(t.status)})
                      </span>
                    </span>
                    {t.status === "open" && configured ? (
                      <button
                        type="button"
                        className="text-xs text-[var(--cwg-green)]"
                        onClick={() => {
                          const client = createClient();
                          if (!client) return;
                          void completeCrmTask(client, String(t.id)).then(() => reload());
                        }}
                      >
                        Concluir
                      </button>
                    ) : null}
                    {t.status === "open" && !configured ? (
                      <button
                        type="button"
                        className="text-xs text-[var(--cwg-green)]"
                        onClick={() =>
                          setTasks((prev) =>
                            prev.map((row) =>
                              row.id === t.id ? { ...row, status: "done" } : row,
                            ),
                          )
                        }
                      >
                        Concluir
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10">
              <h2 className="font-semibold">Histórico de serviço</h2>
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
                  <li key={String(h.id)}>
                    {String(h.summary)} · {String(h.occurred_on)}
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
