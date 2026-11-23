/** @deprecated Prefer appointments / crm / messaging / favorites / calendar modules. */
export {
  createServiceRequest,
  updateAppointmentStatus,
  confirmAppointmentSide as confirmServiceSide,
} from "./appointments";
export { listCrmClients, createCrmClient } from "./crm";
export { sendMessage } from "./messaging";
export { toggleFavorite } from "./favorites";

import type { CwgSupabase } from "./clients";

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
