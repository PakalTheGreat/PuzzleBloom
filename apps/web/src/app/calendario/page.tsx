"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  WEEKDAY_LABELS_PT,
  addAvailabilityException,
  addDays,
  listAppointmentsInRange,
  listAvailabilityExceptions,
  listAvailabilityRules,
  startOfDay,
  upsertAvailabilityRule,
} from "@cwg/api";

import { SiteHeader } from "@/components/SiteHeader";
import { readDemoSessionClient } from "@/lib/demo/client-session";
import {
  DEMO_APPOINTMENTS,
  DEMO_AVAILABILITY_RULES,
  DEMO_EXCEPTIONS,
} from "@cwg/demo";
import { createClient } from "@/lib/supabase/client";
import { getPublicSupabaseEnv } from "@/lib/env";
import { getMySpecialistProfileId } from "@/lib/specialist";

type Appt = {
  id: string;
  status: string;
  starts_at: string;
  ends_at: string;
  mode: string;
};

type Rule = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  mode: string | null;
};

export default function CalendarioPage() {
  const { configured } = getPublicSupabaseEnv();
  const [view, setView] = useState<"day" | "week" | "agenda">("week");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [spId, setSpId] = useState<string | null>(null);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [exceptions, setExceptions] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [weekday, setWeekday] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  const range = useMemo(() => {
    if (view === "day") {
      const from = startOfDay(anchor);
      const to = addDays(from, 1);
      return { from, to };
    }
    if (view === "week") {
      const d = startOfDay(anchor);
      const day = d.getDay();
      const from = addDays(d, -day);
      const to = addDays(from, 7);
      return { from, to };
    }
    const from = startOfDay(anchor);
    const to = addDays(from, 30);
    return { from, to };
  }, [anchor, view]);

  const reload = useCallback(async () => {
    if (!configured) {
      const session = readDemoSessionClient();
      if (!session || session.activeRole !== "specialist") {
        setError("Login especialista necessário.");
        return;
      }
      const id = session.specialistProfileId ?? "sp-ana";
      setSpId(id);
      setError(null);
      setAppts(
        DEMO_APPOINTMENTS.filter((a) => a.specialist_profile_id === id).map((a) => ({
          id: a.id,
          status: a.status,
          starts_at: a.starts_at,
          ends_at: a.ends_at,
          mode: a.mode,
        })),
      );
      setRules([...DEMO_AVAILABILITY_RULES]);
      setExceptions([...DEMO_EXCEPTIONS]);
      return;
    }
    const client = createClient();
    if (!client) return;
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) {
      setError("Login especialista necessário.");
      return;
    }
    const id = await getMySpecialistProfileId(client, auth.user.id);
    if (!id) {
      setError("Ative perfil especialista.");
      return;
    }
    setSpId(id);
    const [a, r, e] = await Promise.all([
      listAppointmentsInRange(client, id, range.from.toISOString(), range.to.toISOString()),
      listAvailabilityRules(client, id),
      listAvailabilityExceptions(client, id),
    ]);
    if (a.error) setError(a.error.message);
    else setAppts((a.data as Appt[]) ?? []);
    if (r.error) setError(r.error.message);
    else setRules((r.data as Rule[]) ?? []);
    if (e.error) setError(e.error.message);
    else setExceptions((e.data as Array<Record<string, unknown>>) ?? []);
  }, [configured, range.from, range.to]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function addRule() {
    if (!spId) return;
    if (!configured) {
      setRules((prev) => [
        ...prev,
        {
          id: `rule-${Date.now()}`,
          weekday,
          start_time: startTime,
          end_time: endTime,
          mode: "remote",
        },
      ]);
      return;
    }
    const client = createClient();
    if (!client) return;
    const { error: err } = await upsertAvailabilityRule(client, {
      specialist_profile_id: spId,
      weekday,
      start_time: startTime,
      end_time: endTime,
      mode: "remote",
    });
    if (err) setError(err.message);
    await reload();
  }

  async function blockToday() {
    if (!spId) return;
    if (!configured) {
      setExceptions((prev) => [
        ...prev,
        {
          id: `ex-${Date.now()}`,
          exception_date: new Date().toISOString().slice(0, 10),
          note: "Bloqueio manual",
        },
      ]);
      return;
    }
    const client = createClient();
    if (!client) return;
    const { error: err } = await addAvailabilityException(client, {
      specialist_profile_id: spId,
      exception_date: new Date().toISOString().slice(0, 10),
      note: "Bloqueio manual",
    });
    if (err) setError(err.message);
    await reload();
  }

  const days =
    view === "week"
      ? Array.from({ length: 7 }, (_, i) => {
          const d = startOfDay(anchor);
          const from = addDays(d, -d.getDay() + i);
          return from;
        })
      : [anchor];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--cwg-green-deep)]">
          Calendário
        </h1>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {(["day", "week", "agenda"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-[10px] px-3 py-1.5 ${view === v ? "bg-[var(--cwg-green)] text-white" : "border"}`}
            >
              {v === "day" ? "Dia" : v === "week" ? "Semana" : "Agenda"}
            </button>
          ))}
          <button
            type="button"
            className="rounded border px-3 py-1.5"
            onClick={() => setAnchor(addDays(anchor, view === "week" ? -7 : -1))}
          >
            ←
          </button>
          <button
            type="button"
            className="rounded border px-3 py-1.5"
            onClick={() => setAnchor(addDays(anchor, view === "week" ? 7 : 1))}
          >
            →
          </button>
        </div>

        {error ? (
          <p className="mt-8 text-sm text-red-700">{error}</p>
        ) : view === "agenda" ? (
          <ul className="mt-8 space-y-3 text-sm">
            {appts.map((a) => (
              <li key={a.id} className="border-b pb-2">
                <span className="font-medium">{a.status}</span> ·{" "}
                {new Date(a.starts_at).toLocaleString("pt-BR")} · {a.mode}
              </li>
            ))}
            {appts.length === 0 ? (
              <li className="text-[var(--cwg-text-secondary)]">Sem eventos no período.</li>
            ) : null}
          </ul>
        ) : (
          <div className={`mt-8 grid gap-3 ${view === "week" ? "md:grid-cols-7" : ""}`}>
            {days.map((d) => {
              const dayAppts = appts.filter((a) => {
                const s = new Date(a.starts_at);
                return s.toDateString() === d.toDateString();
              });
              return (
                <div
                  key={d.toISOString()}
                  className="min-h-40 rounded-[10px] border border-[var(--cwg-graphite-100)] bg-white/80 p-3"
                >
                  <div className="text-xs font-semibold text-[var(--cwg-graphite-500)]">
                    {WEEKDAY_LABELS_PT[d.getDay()]} {d.getDate()}/{d.getMonth() + 1}
                  </div>
                  <ul className="mt-2 space-y-1 text-xs">
                    {dayAppts.map((a) => (
                      <li key={a.id} className="rounded bg-[var(--cwg-green)]/10 px-1 py-0.5">
                        {new Date(a.starts_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        {a.status}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        <section className="mt-12 max-w-xl">
          <h2 className="font-semibold">Regras de disponibilidade</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <select
              className="rounded border px-2 py-1"
              value={weekday}
              onChange={(e) => setWeekday(Number(e.target.value))}
            >
              {WEEKDAY_LABELS_PT.map((label, i) => (
                <option key={label} value={i}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="time"
              className="rounded border px-2 py-1"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <input
              type="time"
              className="rounded border px-2 py-1"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
            <button
              type="button"
              onClick={() => void addRule()}
              className="rounded bg-[var(--cwg-green)] px-3 py-1 text-white"
            >
              Adicionar
            </button>
            <button type="button" onClick={() => void blockToday()} className="rounded border px-3 py-1">
              Bloquear hoje
            </button>
          </div>
          <ul className="mt-4 space-y-1 text-sm">
            {rules.map((r) => (
              <li key={r.id}>
                {WEEKDAY_LABELS_PT[r.weekday]} {r.start_time}–{r.end_time}{" "}
                {r.mode ? `(${r.mode})` : ""}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[var(--cwg-graphite-400)]">
            Exceções: {exceptions.length}
          </p>
        </section>
      </main>
    </>
  );
}
