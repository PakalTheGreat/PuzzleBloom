import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { fetchMe, type MeBundle } from "@cwg/api";
import {
  DEMO_PERSONAS,
  findDemoPersonaByEmail,
  type AppRole,
  type DemoPersona,
  type DemoSession,
} from "@cwg/demo";
import type { RoleIntent } from "@cwg/validation";

import {
  clearDemoSession,
  loadDemoSession,
  saveDemoSession,
} from "@/lib/demo-storage";
import { getMobileEnv, getSupabase } from "@/lib/supabase";

type AuthUser = Pick<User, "id" | "email"> & {
  user_metadata?: { full_name?: string };
};

type AuthContextValue = {
  /** True when real Supabase env is present. */
  configured: boolean;
  /** True when running without Supabase (polished local demo). */
  demoMode: boolean;
  loading: boolean;
  session: Session | null;
  user: AuthUser | null;
  me: MeBundle | null;
  demoSession: DemoSession | null;
  signInDemoPersona: (persona: DemoPersona) => Promise<void>;
  signInDemoCredentials: (
    email: string,
    password: string,
  ) => Promise<{ error?: string }>;
  registerDemo: (input: {
    email: string;
    password: string;
    full_name: string;
  }) => Promise<void>;
  attachLegalToDemo: (acceptance: {
    document: "cultivation_authorization" | "terms" | "privacy";
    documentVersion: string;
    acceptedAt: string;
  }) => Promise<void>;
  completeDemoOnboarding: (intent: RoleIntent) => Promise<void>;
  setDemoActiveRole: (role: AppRole) => Promise<void>;
  refreshMe: () => Promise<void>;
  signOutLocal: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function meFromDemo(session: DemoSession): MeBundle {
  return {
    user: {
      id: session.userId,
      email: session.email,
      full_name: session.fullName,
      active_role: session.activeRole === "admin" ? "specialist" : session.activeRole,
    },
    roles: session.roles,
    grower: session.growerProfileId
      ? { id: session.growerProfileId, user_id: session.userId }
      : null,
    specialist: session.specialistProfileId
      ? {
          id: session.specialistProfileId,
          user_id: session.userId,
          slug: "ana-tecnicas",
        }
      : null,
    ageConfirmed: session.onboardingComplete,
    termsAccepted: session.onboardingComplete,
    privacyAccepted: session.onboardingComplete,
    onboardingComplete: session.onboardingComplete,
  };
}

function userFromDemo(session: DemoSession): AuthUser {
  return {
    id: session.userId,
    email: session.email,
    user_metadata: { full_name: session.fullName },
  };
}

function rolesFromIntent(intent: RoleIntent): AppRole[] {
  if (intent === "find") return ["grower"];
  if (intent === "offer") return ["specialist"];
  return ["grower", "specialist"];
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = getMobileEnv().configured;
  const demoMode = !configured;
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<MeBundle | null>(null);
  const [demoSession, setDemoSession] = useState<DemoSession | null>(null);

  const applyDemo = useCallback(async (next: DemoSession | null) => {
    if (next) {
      await saveDemoSession(next);
      setDemoSession(next);
      setMe(meFromDemo(next));
    } else {
      await clearDemoSession();
      setDemoSession(null);
      setMe(null);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    if (demoMode) {
      if (demoSession) setMe(meFromDemo(demoSession));
      return;
    }
    const client = getSupabase();
    if (!client || !session?.user) {
      setMe(null);
      return;
    }
    const bundle = await fetchMe(client, session.user.id);
    setMe(bundle);
  }, [demoMode, demoSession, session?.user]);

  useEffect(() => {
    if (demoMode) {
      void loadDemoSession().then((stored) => {
        if (stored) {
          setDemoSession(stored);
          setMe(meFromDemo(stored));
        }
        setLoading(false);
      });
      return;
    }
    const client = getSupabase();
    if (!client) {
      setLoading(false);
      return;
    }
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, [demoMode]);

  useEffect(() => {
    if (demoMode) return;
    if (session?.user) void refreshMe();
    else setMe(null);
  }, [demoMode, session?.user, refreshMe]);

  const signInDemoPersona = useCallback(
    async (persona: DemoPersona) => {
      const next = { ...DEMO_PERSONAS[persona].session };
      await applyDemo(next);
    },
    [applyDemo],
  );

  const signInDemoCredentials = useCallback(
    async (email: string, password: string) => {
      const found = findDemoPersonaByEmail(email, password);
      if (!found) return { error: "Credenciais de demonstração inválidas." };
      await applyDemo(found);
      return {};
    },
    [applyDemo],
  );

  const registerDemo = useCallback(
    async (input: { email: string; password: string; full_name: string }) => {
      const next: DemoSession = {
        userId: `user-${Date.now()}`,
        email: input.email,
        fullName: input.full_name,
        roles: [],
        activeRole: "grower",
        onboardingComplete: false,
        specialistProfileId: null,
        growerProfileId: null,
        authProvider: "email",
      };
      await applyDemo(next);
    },
    [applyDemo],
  );

  const attachLegalToDemo = useCallback(
    async (acceptance: {
      document: "cultivation_authorization" | "terms" | "privacy";
      documentVersion: string;
      acceptedAt: string;
    }) => {
      const current = demoSession ?? (await loadDemoSession());
      if (!current) return;
      const existing = current.legalAcceptances ?? [];
      const withoutDup = existing.filter(
        (a) =>
          !(
            a.document === acceptance.document &&
            a.documentVersion === acceptance.documentVersion
          ),
      );
      await applyDemo({
        ...current,
        legalAcceptances: [...withoutDup, acceptance],
      });
    },
    [applyDemo, demoSession],
  );

  const completeDemoOnboarding = useCallback(
    async (intent: RoleIntent) => {
      if (!demoSession) return;
      const roles = rolesFromIntent(intent);
      const activeRole = roles.includes("specialist") ? "specialist" : "grower";
      const next: DemoSession = {
        ...demoSession,
        roles,
        activeRole,
        onboardingComplete: true,
        specialistProfileId: roles.includes("specialist")
          ? demoSession.specialistProfileId ?? "sp-ana"
          : null,
        growerProfileId: roles.includes("grower")
          ? demoSession.growerProfileId ?? `gp-${demoSession.userId}`
          : null,
      };
      await applyDemo(next);
    },
    [applyDemo, demoSession],
  );

  const setDemoActiveRole = useCallback(
    async (role: AppRole) => {
      if (!demoSession || !demoSession.roles.includes(role)) return;
      if (role === "admin") return;
      await applyDemo({ ...demoSession, activeRole: role });
    },
    [applyDemo, demoSession],
  );

  const signOutLocal = useCallback(async () => {
    if (demoMode) {
      await applyDemo(null);
      return;
    }
    const client = getSupabase();
    if (client) await client.auth.signOut();
    setMe(null);
  }, [demoMode, applyDemo]);

  const user: AuthUser | null = demoMode
    ? demoSession
      ? userFromDemo(demoSession)
      : null
    : session?.user
      ? {
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata as {
            full_name?: string;
          },
        }
      : null;

  const value = useMemo(
    () => ({
      configured,
      demoMode,
      loading,
      session,
      user,
      me,
      demoSession,
      signInDemoPersona,
      signInDemoCredentials,
      registerDemo,
      attachLegalToDemo,
      completeDemoOnboarding,
      setDemoActiveRole,
      refreshMe,
      signOutLocal,
    }),
    [
      configured,
      demoMode,
      loading,
      session,
      user,
      me,
      demoSession,
      signInDemoPersona,
      signInDemoCredentials,
      registerDemo,
      attachLegalToDemo,
      completeDemoOnboarding,
      setDemoActiveRole,
      refreshMe,
      signOutLocal,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
