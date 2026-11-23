import type { CwgSupabase } from "./clients";

export async function listFavorites(client: CwgSupabase, growerUserId: string) {
  return client
    .from("saved_specialists")
    .select(
      `id, created_at,
      specialist_profiles(
        id, slug, headline, city, state, verification_status, photo_url,
        users(full_name)
      )`,
    )
    .eq("grower_user_id", growerUserId)
    .order("created_at", { ascending: false });
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

export async function isFavorite(
  client: CwgSupabase,
  growerUserId: string,
  specialistProfileId: string,
) {
  const { data, error } = await client
    .from("saved_specialists")
    .select("id")
    .eq("grower_user_id", growerUserId)
    .eq("specialist_profile_id", specialistProfileId)
    .maybeSingle();
  return { data: Boolean(data), error };
}
