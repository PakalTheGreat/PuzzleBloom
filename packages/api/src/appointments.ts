import type { CwgSupabase } from "./clients";

const GROWER_CANCEL = "cancelled_by_grower";
const SPECIALIST_CANCEL = "cancelled_by_specialist";

export async function createServiceRequest(
  client: CwgSupabase,
  input: {
    grower_user_id: string;
    specialist_profile_id: string;
    category_id?: string | null;
    mode: "remote" | "in_person";
    message?: string;
    preferred_windows?: unknown;
  },
) {
  return client
    .from("service_requests")
    .insert({
      grower_user_id: input.grower_user_id,
      specialist_profile_id: input.specialist_profile_id,
      category_id: input.category_id ?? null,
      mode: input.mode,
      message: input.message ?? null,
      preferred_windows: input.preferred_windows ?? [],
      status: "pending",
    })
    .select("*")
    .single();
}

export async function listServiceRequestsForSpecialist(
  client: CwgSupabase,
  specialistProfileId: string,
) {
  return client
    .from("service_requests")
    .select("*, users:grower_user_id(full_name, email)")
    .eq("specialist_profile_id", specialistProfileId)
    .order("created_at", { ascending: false });
}

export async function listServiceRequestsForGrower(
  client: CwgSupabase,
  growerUserId: string,
) {
  return client
    .from("service_requests")
    .select("*, specialist_profiles(slug, headline, users(full_name))")
    .eq("grower_user_id", growerUserId)
    .order("created_at", { ascending: false });
}

export async function updateServiceRequestStatus(
  client: CwgSupabase,
  requestId: string,
  status: string,
) {
  return client
    .from("service_requests")
    .update({ status })
    .eq("id", requestId)
    .select("*")
    .single();
}

/** Accept a request and create a pending appointment slot. */
export async function acceptRequestWithAppointment(
  client: CwgSupabase,
  input: {
    requestId: string;
    grower_user_id: string;
    specialist_profile_id: string;
    mode: "remote" | "in_person";
    starts_at: string;
    ends_at: string;
    location_summary?: string | null;
  },
) {
  const { error: reqErr } = await updateServiceRequestStatus(
    client,
    input.requestId,
    "accepted",
  );
  if (reqErr) return { data: null, error: reqErr };

  const { data, error } = await client
    .from("appointments")
    .insert({
      service_request_id: input.requestId,
      grower_user_id: input.grower_user_id,
      specialist_profile_id: input.specialist_profile_id,
      mode: input.mode,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      location_summary: input.location_summary ?? null,
      status: "accepted",
      timezone: "America/Sao_Paulo",
    })
    .select("*")
    .single();

  return { data, error };
}

export async function updateAppointmentStatus(
  client: CwgSupabase,
  appointmentId: string,
  status: string,
) {
  return client
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .select("*")
    .single();
}

export async function cancelAppointment(
  client: CwgSupabase,
  appointmentId: string,
  by: "grower" | "specialist",
) {
  return updateAppointmentStatus(
    client,
    appointmentId,
    by === "grower" ? GROWER_CANCEL : SPECIALIST_CANCEL,
  );
}

export async function listAppointmentsForUser(
  client: CwgSupabase,
  userId: string,
  specialistProfileId?: string | null,
) {
  let q = client
    .from("appointments")
    .select(
      `*,
      specialist_profiles(slug, headline, users(full_name)),
      service_confirmations(id, grower_confirmed_at, specialist_confirmed_at)`,
    )
    .order("starts_at", { ascending: true })
    .limit(80);

  if (specialistProfileId) {
    q = q.eq("specialist_profile_id", specialistProfileId);
  } else {
    q = q.eq("grower_user_id", userId);
  }
  return q;
}

/** Ensure confirmation row exists for appointment; confirm one side. */
export async function confirmAppointmentSide(
  client: CwgSupabase,
  appointmentId: string,
  side: "grower" | "specialist",
) {
  const { data: existing } = await client
    .from("service_confirmations")
    .select("*")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  let confirmationId = existing?.id as string | undefined;
  if (!confirmationId) {
    const { data: created, error } = await client
      .from("service_confirmations")
      .insert({ appointment_id: appointmentId })
      .select("*")
      .single();
    if (error) return { data: null, error, reviewEligible: false };
    confirmationId = created.id as string;
  }

  const patch =
    side === "grower"
      ? { grower_confirmed_at: new Date().toISOString() }
      : { specialist_confirmed_at: new Date().toISOString() };

  const { data, error } = await client
    .from("service_confirmations")
    .update(patch)
    .eq("id", confirmationId)
    .select("*")
    .single();

  const reviewEligible = Boolean(
    data?.grower_confirmed_at && data?.specialist_confirmed_at,
  );
  return { data, error, reviewEligible };
}

export async function submitReview(
  client: CwgSupabase,
  input: {
    author_user_id: string;
    specialist_profile_id: string;
    appointment_id: string;
    scores: {
      professionalism: number;
      communication: number;
      punctuality: number;
      technical: number;
      organization: number;
    };
    body?: string;
  },
) {
  // Gate: mutual confirmation required
  const { data: conf } = await client
    .from("service_confirmations")
    .select("*")
    .eq("appointment_id", input.appointment_id)
    .maybeSingle();

  if (!conf?.grower_confirmed_at || !conf?.specialist_confirmed_at) {
    return {
      data: null,
      error: { message: "Confirmação mútua necessária antes da avaliação." },
    };
  }

  return client
    .from("reviews")
    .insert({
      author_user_id: input.author_user_id,
      specialist_profile_id: input.specialist_profile_id,
      appointment_id: input.appointment_id,
      origin: "app",
      score_professionalism: input.scores.professionalism,
      score_communication: input.scores.communication,
      score_punctuality: input.scores.punctuality,
      score_technical: input.scores.technical,
      score_organization: input.scores.organization,
      body: input.body ?? null,
    })
    .select("*")
    .single();
}

export function nextAppointmentActions(
  status: string,
  role: "grower" | "specialist",
): string[] {
  const map: Record<string, { grower: string[]; specialist: string[] }> = {
    pending: {
      grower: [GROWER_CANCEL],
      specialist: ["accepted", "rejected", SPECIALIST_CANCEL],
    },
    accepted: {
      grower: [GROWER_CANCEL, "awaiting_confirmation"],
      specialist: ["awaiting_confirmation", "confirmed", SPECIALIST_CANCEL],
    },
    awaiting_confirmation: {
      grower: ["confirmed", GROWER_CANCEL],
      specialist: ["confirmed", SPECIALIST_CANCEL],
    },
    confirmed: {
      grower: ["completed", GROWER_CANCEL],
      specialist: ["completed", SPECIALIST_CANCEL],
    },
  };
  return map[status]?.[role] ?? [];
}
