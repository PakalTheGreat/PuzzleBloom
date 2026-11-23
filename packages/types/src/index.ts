/** Shared domain enums and DTOs (Phase 1 stubs). */

export type AppRole = "grower" | "specialist" | "admin";
export type ActiveRole = "grower" | "specialist";

export type VerificationStatus =
  | "unverified"
  | "pending_review"
  | "verified"
  | "rejected"
  | "suspended"
  | "expired";

export type AppointmentStatus =
  | "pending"
  | "accepted"
  | "awaiting_confirmation"
  | "confirmed"
  | "completed"
  | "cancelled_by_grower"
  | "cancelled_by_specialist"
  | "rejected"
  | "expired";

export type ServiceMode = "remote" | "in_person";

export type SubscriptionPlanCode = "free" | "pro" | "premium";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  locale: string;
  timezone: string;
  active_role: ActiveRole | null;
  date_of_birth: string | null;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpecialistProfile {
  id: string;
  user_id: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  city: string | null;
  state: string | null;
  region: string | null;
  offers_remote: boolean;
  offers_in_person: boolean;
  years_experience: number | null;
  verification_status: VerificationStatus;
  membership_started_at: string | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GrowerProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  organization_id: string | null;
  city: string | null;
  state: string | null;
  region: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Specialty {
  id: string;
  slug: string;
  name_pt: string;
  description_pt: string | null;
  is_active: boolean;
  sort_order: number;
}
