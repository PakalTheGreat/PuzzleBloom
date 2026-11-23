import type { CwgSupabase } from "@cwg/api";

export async function getMySpecialistProfileId(client: CwgSupabase, userId: string) {
  const { data } = await client
    .from("specialist_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}
