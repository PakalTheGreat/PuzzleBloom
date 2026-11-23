import type { CwgSupabase } from "./clients";

export async function listAvailabilityRules(
  client: CwgSupabase,
  specialistProfileId: string,
) {
  return client
    .from("availability_rules")
    .select("*")
    .eq("specialist_profile_id", specialistProfileId)
    .order("weekday", { ascending: true });
}

export async function upsertAvailabilityRule(
  client: CwgSupabase,
  input: {
    id?: string;
    specialist_profile_id: string;
    weekday: number;
    start_time: string;
    end_time: string;
    mode?: "remote" | "in_person" | null;
  },
) {
  if (input.id) {
    return client
      .from("availability_rules")
      .update({
        weekday: input.weekday,
        start_time: input.start_time,
        end_time: input.end_time,
        mode: input.mode ?? null,
      })
      .eq("id", input.id)
      .select("*")
      .single();
  }
  return client
    .from("availability_rules")
    .insert({
      specialist_profile_id: input.specialist_profile_id,
      weekday: input.weekday,
      start_time: input.start_time,
      end_time: input.end_time,
      mode: input.mode ?? null,
    })
    .select("*")
    .single();
}

export async function deleteAvailabilityRule(client: CwgSupabase, ruleId: string) {
  return client.from("availability_rules").delete().eq("id", ruleId);
}

export async function listAvailabilityExceptions(
  client: CwgSupabase,
  specialistProfileId: string,
) {
  return client
    .from("availability_exceptions")
    .select("*")
    .eq("specialist_profile_id", specialistProfileId)
    .order("exception_date", { ascending: true });
}

export async function addAvailabilityException(
  client: CwgSupabase,
  input: {
    specialist_profile_id: string;
    exception_date: string;
    is_unavailable?: boolean;
    note?: string | null;
  },
) {
  return client
    .from("availability_exceptions")
    .insert({
      specialist_profile_id: input.specialist_profile_id,
      exception_date: input.exception_date,
      is_unavailable: input.is_unavailable ?? true,
      note: input.note ?? null,
    })
    .select("*")
    .single();
}

/** Appointments in a date range for calendar views. */
export async function listAppointmentsInRange(
  client: CwgSupabase,
  specialistProfileId: string,
  fromIso: string,
  toIso: string,
) {
  return client
    .from("appointments")
    .select("id, status, starts_at, ends_at, mode, location_summary, grower_user_id")
    .eq("specialist_profile_id", specialistProfileId)
    .gte("starts_at", fromIso)
    .lte("starts_at", toIso)
    .order("starts_at", { ascending: true });
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export const WEEKDAY_LABELS_PT = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const;
