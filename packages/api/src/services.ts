import type { CwgSupabase } from "./clients";

export async function createServiceRequest(
  client: CwgSupabase,
  input: {
    grower_user_id: string;
    specialist_profile_id: string;
    category_id?: string | null;
    mode: "remote" | "in_person";
    message?: string;
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
      status: "pending",
    })
    .select("*")
    .single();
}

export async function createAppointment(
  client: CwgSupabase,
  input: {
    grower_user_id: string;
    specialist_profile_id: string;
    service_request_id?: string | null;
    mode: "remote" | "in_person";
    starts_at: string;
    ends_at: string;
    location_summary?: string | null;
  },
) {
  return client
    .from("appointments")
    .insert({
      ...input,
      status: "pending",
      timezone: "America/Sao_Paulo",
    })
    .select("*")
    .single();
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

export async function confirmServiceSide(
  client: CwgSupabase,
  confirmationId: string,
  side: "grower" | "specialist",
) {
  const patch =
    side === "grower"
      ? { grower_confirmed_at: new Date().toISOString() }
      : { specialist_confirmed_at: new Date().toISOString() };
  return client
    .from("service_confirmations")
    .update(patch)
    .eq("id", confirmationId)
    .select("*")
    .single();
}

export async function toggleFavorite(
  client: CwgSupabase,
  growerUserId: string,
  specialistProfileId: string,
  save: boolean,
) {
  if (save) {
    return client.from("saved_specialists").upsert(
      {
        grower_user_id: growerUserId,
        specialist_profile_id: specialistProfileId,
      },
      { onConflict: "grower_user_id,specialist_profile_id" },
    );
  }
  return client
    .from("saved_specialists")
    .delete()
    .eq("grower_user_id", growerUserId)
    .eq("specialist_profile_id", specialistProfileId);
}

export async function listCrmClients(client: CwgSupabase, specialistProfileId: string) {
  return client
    .from("crm_clients")
    .select("*")
    .eq("specialist_profile_id", specialistProfileId)
    .order("updated_at", { ascending: false });
}

export async function createCrmClient(
  client: CwgSupabase,
  input: {
    specialist_profile_id: string;
    display_name: string;
    grower_user_id?: string | null;
    status?: string;
  },
) {
  return client
    .from("crm_clients")
    .insert({
      specialist_profile_id: input.specialist_profile_id,
      display_name: input.display_name,
      grower_user_id: input.grower_user_id ?? null,
      status: input.status ?? "lead",
    })
    .select("*")
    .single();
}

export async function sendMessage(
  client: CwgSupabase,
  input: { conversation_id: string; sender_id: string; body: string },
) {
  return client.from("messages").insert(input).select("*").single();
}

export async function getEntitlement(
  client: CwgSupabase,
  specialistProfileId: string,
  featureKey: string,
) {
  const { data, error } = await client.rpc("resolve_plan_feature", {
    p_specialist_profile_id: specialistProfileId,
    p_feature_key: featureKey,
  });
  return { data: data as string | null, error };
}
