import { LEGAL_VERSIONS, slugifyName } from "@cwg/shared";
import type { ActiveRole } from "@cwg/types";
import type {
  GrowerProfileInput,
  RoleIntent,
  SpecialistProfileInput,
  UserProfileUpdate,
} from "@cwg/validation";

import type { CwgSupabase } from "./clients";

export type MeBundle = {
  user: Record<string, unknown> | null;
  roles: string[];
  grower: Record<string, unknown> | null;
  specialist: Record<string, unknown> | null;
  ageConfirmed: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  onboardingComplete: boolean;
};

export async function fetchMe(client: CwgSupabase, userId: string): Promise<MeBundle> {
  const [
    { data: user },
    { data: roles },
    { data: grower },
    { data: specialist },
    { data: age },
    { data: terms },
    { data: privacy },
  ] = await Promise.all([
    client.from("users").select("*").eq("id", userId).maybeSingle(),
    client.from("user_roles").select("role").eq("user_id", userId),
    client.from("grower_profiles").select("*").eq("user_id", userId).maybeSingle(),
    client.from("specialist_profiles").select("*").eq("user_id", userId).maybeSingle(),
    client.from("age_confirmations").select("id").eq("user_id", userId).maybeSingle(),
    client
      .from("terms_acceptances")
      .select("id")
      .eq("user_id", userId)
      .eq("document_version", LEGAL_VERSIONS.terms)
      .maybeSingle(),
    client
      .from("privacy_consents")
      .select("id")
      .eq("user_id", userId)
      .eq("document_version", LEGAL_VERSIONS.privacy)
      .maybeSingle(),
  ]);

  const roleList = (roles ?? []).map((r) => r.role as string);
  const ageConfirmed = Boolean(age);
  const termsAccepted = Boolean(terms);
  const privacyAccepted = Boolean(privacy);
  const onboardingComplete =
    ageConfirmed && termsAccepted && privacyAccepted && roleList.length > 0;

  return {
    user: user ?? null,
    roles: roleList,
    grower: grower ?? null,
    specialist: specialist ?? null,
    ageConfirmed,
    termsAccepted,
    privacyAccepted,
    onboardingComplete,
  };
}

export async function updateUserProfile(
  client: CwgSupabase,
  userId: string,
  patch: UserProfileUpdate,
) {
  return client.from("users").update(patch).eq("id", userId).select("*").single();
}

export async function setActiveRole(
  client: CwgSupabase,
  userId: string,
  active_role: ActiveRole,
) {
  return client.from("users").update({ active_role }).eq("id", userId).select("*").single();
}

export async function recordLegalAndAge(
  client: CwgSupabase,
  userId: string,
  meta?: { ip?: string; user_agent?: string },
) {
  const [age, terms, privacy] = await Promise.all([
    client.from("age_confirmations").upsert(
      {
        user_id: userId,
        confirmed_18_plus: true,
        confirmed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    ),
    client.from("terms_acceptances").insert({
      user_id: userId,
      document_version: LEGAL_VERSIONS.terms,
      ip: meta?.ip ?? null,
      user_agent: meta?.user_agent ?? null,
    }),
    client.from("privacy_consents").insert({
      user_id: userId,
      document_version: LEGAL_VERSIONS.privacy,
      ip: meta?.ip ?? null,
      user_agent: meta?.user_agent ?? null,
    }),
  ]);

  return { age, terms, privacy };
}

/**
 * Records pre-auth cultivation-authorization declaration into `terms_acceptances`
 * using LEGAL_VERSIONS.cultivationAuthorization as document_version.
 * Does not assert the platform validated any license.
 */
export async function recordCultivationAuthorization(
  client: CwgSupabase,
  userId: string,
  meta?: { ip?: string; user_agent?: string },
) {
  const existing = await client
    .from("terms_acceptances")
    .select("id")
    .eq("user_id", userId)
    .eq("document_version", LEGAL_VERSIONS.cultivationAuthorization)
    .maybeSingle();
  if (existing.data?.id) return existing;
  return client.from("terms_acceptances").insert({
    user_id: userId,
    document_version: LEGAL_VERSIONS.cultivationAuthorization,
    ip: meta?.ip ?? null,
    user_agent: meta?.user_agent ?? null,
  });
}

function rolesFromIntent(intent: RoleIntent): ActiveRole[] {
  if (intent === "find") return ["grower"];
  if (intent === "offer") return ["specialist"];
  return ["grower", "specialist"];
}

export async function activateRolesFromIntent(
  client: CwgSupabase,
  userId: string,
  intent: RoleIntent,
  fullName?: string | null,
) {
  const roles = rolesFromIntent(intent);
  const active_role = roles.includes("specialist") && intent === "offer" ? "specialist" : roles[0]!;

  for (const role of roles) {
    const { error } = await client.from("user_roles").upsert(
      { user_id: userId, role },
      { onConflict: "user_id,role" },
    );
    if (error) return { error };
  }

  if (roles.includes("grower")) {
    const { error } = await client.from("grower_profiles").upsert(
      {
        user_id: userId,
        display_name: fullName ?? null,
      },
      { onConflict: "user_id" },
    );
    if (error) return { error };
  }

  if (roles.includes("specialist")) {
    const base = slugifyName(fullName || "especialista") || "especialista";
    const slug = `${base}-${userId.slice(0, 8)}`;
    const { error } = await client.from("specialist_profiles").upsert(
      {
        user_id: userId,
        slug,
        offers_remote: true,
        offers_in_person: false,
        verification_status: "unverified",
        membership_started_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) return { error };
  }

  const { error } = await client
    .from("users")
    .update({ active_role })
    .eq("id", userId);

  return { error, active_role, roles };
}

export async function updateGrowerProfile(
  client: CwgSupabase,
  userId: string,
  patch: GrowerProfileInput,
) {
  return client
    .from("grower_profiles")
    .update(patch)
    .eq("user_id", userId)
    .select("*")
    .single();
}

export async function updateSpecialistProfile(
  client: CwgSupabase,
  profileId: string,
  patch: SpecialistProfileInput,
) {
  const { specialty_ids, photo_url, ...rest } = patch;
  const payload = {
    ...rest,
    photo_url: photo_url === "" ? null : photo_url,
  };

  const { data, error } = await client
    .from("specialist_profiles")
    .update(payload)
    .eq("id", profileId)
    .select("*")
    .single();

  if (error) return { data: null, error };

  if (specialty_ids) {
    await client.from("specialist_specialties").delete().eq("specialist_profile_id", profileId);
    if (specialty_ids.length > 0) {
      const rows = specialty_ids.map((specialty_id, i) => ({
        specialist_profile_id: profileId,
        specialty_id,
        is_primary: i === 0,
      }));
      const { error: linkError } = await client.from("specialist_specialties").insert(rows);
      if (linkError) return { data: null, error: linkError };
    }
  }

  return { data, error: null };
}

export async function getSpecialistBySlug(client: CwgSupabase, slug: string) {
  const { data: profile, error } = await client
    .from("specialist_profiles")
    .select(
      `*,
      users!inner(full_name, avatar_url),
      specialist_specialties(
        is_primary,
        specialties(id, slug, name_pt)
      ),
      professional_credentials(id, kind, title, issuer, is_public, verified_by_admin),
      service_areas(state, city, region)`,
    )
    .eq("slug", slug)
    .maybeSingle();

  return { data: profile, error };
}

export async function listSpecialties(client: CwgSupabase) {
  return client
    .from("specialties")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
}

export async function exploreSpecialists(
  client: CwgSupabase,
  filters?: {
    state?: string;
    city?: string;
    q?: string;
    mode?: "in_person" | "remote" | "all";
  },
) {
  let query = client
    .from("specialist_profiles")
    .select(
      `id, slug, headline, city, state, region, offers_remote, offers_in_person,
       service_lat, service_lng, years_experience, verification_status, photo_url,
       last_active_at, users!inner(full_name)`,
    )
    .order("last_active_at", { ascending: false, nullsFirst: false })
    .limit(40);

  if (filters?.state) query = query.eq("state", filters.state);
  if (filters?.city) query = query.ilike("city", `%${filters.city}%`);
  if (filters?.mode === "in_person") query = query.eq("offers_in_person", true);
  if (filters?.mode === "remote") query = query.eq("offers_remote", true);
  if (filters?.q) query = query.or(`headline.ilike.%${filters.q}%,bio.ilike.%${filters.q}%`);

  return query;
}
