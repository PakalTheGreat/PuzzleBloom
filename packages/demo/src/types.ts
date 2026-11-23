export type AppRole = "grower" | "specialist" | "admin";

export type DemoSession = {
  userId: string;
  email: string;
  fullName: string;
  roles: AppRole[];
  activeRole: AppRole;
  onboardingComplete: boolean;
  specialistProfileId: string | null;
  growerProfileId: string | null;
};

export const DEMO_COOKIE = "cwg_demo";
export const DEMO_MODE_LABEL = "Modo demonstração";
