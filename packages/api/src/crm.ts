import type { CwgSupabase } from "./clients";

export async function listCrmClients(client: CwgSupabase, specialistProfileId: string) {
  return client
    .from("crm_clients")
    .select("*")
    .eq("specialist_profile_id", specialistProfileId)
    .order("updated_at", { ascending: false });
}

export async function getCrmClient(client: CwgSupabase, clientId: string) {
  return client.from("crm_clients").select("*").eq("id", clientId).maybeSingle();
}

export async function createCrmClient(
  client: CwgSupabase,
  input: {
    specialist_profile_id: string;
    display_name: string;
    grower_user_id?: string | null;
    status?: string;
    email?: string | null;
    phone?: string | null;
  },
) {
  return client
    .from("crm_clients")
    .insert({
      specialist_profile_id: input.specialist_profile_id,
      display_name: input.display_name,
      grower_user_id: input.grower_user_id ?? null,
      status: input.status ?? "lead",
      email: input.email ?? null,
      phone: input.phone ?? null,
    })
    .select("*")
    .single();
}

export async function updateCrmClient(
  client: CwgSupabase,
  clientId: string,
  patch: Record<string, unknown>,
) {
  return client.from("crm_clients").update(patch).eq("id", clientId).select("*").single();
}

export async function listCrmNotes(client: CwgSupabase, crmClientId: string) {
  return client
    .from("crm_client_notes")
    .select("*")
    .eq("crm_client_id", crmClientId)
    .order("created_at", { ascending: false });
}

export async function addCrmNote(
  client: CwgSupabase,
  crmClientId: string,
  body: string,
) {
  return client
    .from("crm_client_notes")
    .insert({ crm_client_id: crmClientId, body })
    .select("*")
    .single();
}

export async function listCrmTasks(
  client: CwgSupabase,
  specialistProfileId: string,
  crmClientId?: string,
) {
  let q = client
    .from("crm_tasks")
    .select("*")
    .eq("specialist_profile_id", specialistProfileId)
    .order("due_at", { ascending: true, nullsFirst: false });
  if (crmClientId) q = q.eq("crm_client_id", crmClientId);
  return q;
}

export async function createCrmTask(
  client: CwgSupabase,
  input: {
    specialist_profile_id: string;
    crm_client_id?: string | null;
    title: string;
    priority?: string;
    due_at?: string | null;
  },
) {
  return client
    .from("crm_tasks")
    .insert({
      specialist_profile_id: input.specialist_profile_id,
      crm_client_id: input.crm_client_id ?? null,
      title: input.title,
      priority: input.priority ?? "normal",
      due_at: input.due_at ?? null,
    })
    .select("*")
    .single();
}

export async function completeCrmTask(client: CwgSupabase, taskId: string) {
  return client
    .from("crm_tasks")
    .update({ done_at: new Date().toISOString() })
    .eq("id", taskId)
    .select("*")
    .single();
}

export async function listCrmServiceHistory(client: CwgSupabase, crmClientId: string) {
  return client
    .from("crm_service_records")
    .select("*, appointments(starts_at, status, mode)")
    .eq("crm_client_id", crmClientId)
    .order("occurred_on", { ascending: false });
}

export async function addCrmServiceRecord(
  client: CwgSupabase,
  input: {
    crm_client_id: string;
    summary: string;
    occurred_on?: string | null;
    appointment_id?: string | null;
  },
) {
  return client
    .from("crm_service_records")
    .insert({
      crm_client_id: input.crm_client_id,
      summary: input.summary,
      occurred_on: input.occurred_on ?? null,
      appointment_id: input.appointment_id ?? null,
    })
    .select("*")
    .single();
}
