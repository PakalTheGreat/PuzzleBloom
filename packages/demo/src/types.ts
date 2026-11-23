export type AppRole = "grower" | "specialist" | "admin";

export type DemoLegalAcceptance = {
  document: "cultivation_authorization" | "terms" | "privacy";
  documentVersion: string;
  acceptedAt: string;
};

export type DemoSession = {
  userId: string;
  email: string;
  fullName: string;
  roles: AppRole[];
  activeRole: AppRole;
  onboardingComplete: boolean;
  specialistProfileId: string | null;
  growerProfileId: string | null;
  /** Auth provider used for this demo session (email | google). */
  authProvider?: "email" | "google";
  /** Pre-auth / onboarding legal acceptances (terms_acceptances shape). */
  legalAcceptances?: DemoLegalAcceptance[];
};

export const DEMO_COOKIE = "cwg_demo";
export const DEMO_LEGAL_COOKIE = "cwg_legal_auth";
export const DEMO_MODE_LABEL = "Modo demonstração";
